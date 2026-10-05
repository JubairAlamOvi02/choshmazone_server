import express from 'express';
import { query, pool } from '../config/db.js';
import { verifyToken, optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper: Notify Telegram Bot
const notifyTelegram = async (order, items) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    try {
        const address = order.shipping_address || {};
        const itemsList = items.map(i => `• ${i.name || i.title || 'Item'} (Qty: ${i.quantity || 1}) - ৳${(i.price || i.unit_price || 0) * (i.quantity || 1)}`).join('\n');
        const text = `🛒 *NEW ORDER RECEIVED!*
━━━━━━━━━━━━━━━━━━
*Order ID:* \`${order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A'}\`
*Total Amount:* ৳${order.total_amount}
*Payment:* ${order.payment_method || 'COD'}

*Customer:* ${address.name || 'N/A'}
*Phone:* ${address.phone || 'N/A'}
*Address:* ${address.address || ''}, ${address.district || address.city || ''}

*Items:*
${itemsList}
━━━━━━━━━━━━━━━━━━`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.warn('[Telegram Notification Error]:', e.message);
    }
};

// Helper: Sync with Google Sheets
const syncGoogleSheet = async (order, items) => {
    const url = process.env.GOOGLE_SCRIPT_URL;
    if (!url) return;

    try {
        const address = order.shipping_address || {};
        const payload = {
            order_id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            status: order.status,
            payment_method: order.payment_method,
            customer_name: address.name,
            phone: address.phone,
            address: `${address.address || ''}, ${address.district || address.city || ''}`,
            items: items.map(i => `${i.name || i.title || 'Item'} (x${i.quantity || 1})`).join(', ')
        };

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.warn('[Google Sheet Sync Error]:', e.message);
    }
};

// Create a new order (Guest or Authenticated)
router.post('/', optionalAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { total_amount, shipping_address, payment_method, payment_details, items } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!total_amount || !shipping_address || !items || !items.length) {
            return res.status(400).json({ error: 'Missing required order fields.' });
        }

        const orderSql = `
            INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, payment_details, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `;
        const orderRes = await client.query(orderSql, [
            userId,
            total_amount,
            JSON.stringify(shipping_address),
            payment_method || 'cod',
            JSON.stringify(payment_details || {})
        ]);
        const order = orderRes.rows[0];

        // Insert items
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const item of items) {
            const productId = item.product_id || (isUUID.test(item.id) ? item.id : null);
            const style = item.style || 'Default';
            const unitPrice = item.price || item.unit_price;

            await client.query(`
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, style)
                VALUES ($1, $2, $3, $4, $5)
            `, [order.id, productId, item.quantity, unitPrice, style]);
        }

        await client.query('COMMIT');

        // Non-blocking notifications
        notifyTelegram(order, items);
        syncGoogleSheet(order, items);

        res.status(201).json(order);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Order Create Error]:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Fetch recently purchased items (Public-safe social proof)
router.get('/recent-purchased', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '4', 10);
        const sql = `
            SELECT 
                oi.id, oi.created_at,
                p.id as product_id, p.name, p.price, p.image_url, p.images, p.category, p.variants
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE p.is_active = TRUE AND o.status != 'cancelled'
            ORDER BY oi.created_at DESC
            LIMIT $1
        `;
        const result = await query(sql, [limit * 2]);
        
        const seen = new Set();
        const output = [];
        for (const row of result.rows) {
            if (!seen.has(row.product_id)) {
                seen.add(row.product_id);
                output.push({
                    id: row.product_id,
                    name: row.name,
                    title: row.name,
                    price: row.price,
                    image_url: row.image_url,
                    image: row.image_url,
                    images: row.images || [],
                    category: row.category,
                    variants: row.variants,
                    purchased_at: row.created_at
                });
            }
            if (output.length >= limit) break;
        }

        res.json(output);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public Track Order (By Phone or Order ID)
router.get('/track', async (req, res) => {
    try {
        const { query: searchQuery } = req.query;
        if (!searchQuery) {
            return res.status(400).json({ error: 'Search query required.' });
        }

        const trimmed = searchQuery.trim();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

        let sql = `
            SELECT o.*, 
                   json_agg(
                       json_build_object(
                           'id', oi.id,
                           'quantity', oi.quantity,
                           'unit_price', oi.unit_price,
                           'style', oi.style,
                           'product', json_build_object('name', p.name, 'image_url', p.image_url)
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON oi.product_id = p.id
        `;

        let params = [];
        if (isUUID) {
            sql += ' WHERE o.id = $1';
            params.push(trimmed);
        } else {
            sql += " WHERE o.shipping_address->>'phone' ILIKE $1";
            params.push(`%${trimmed}%`);
        }

        sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch user's own orders
router.get('/my', verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT o.*, 
                   json_agg(
                       json_build_object(
                           'id', oi.id,
                           'quantity', oi.quantity,
                           'unit_price', oi.unit_price,
                           'style', oi.style,
                           'product', json_build_object('name', p.name, 'image_url', p.image_url)
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const result = await query(sql, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Fetch all orders
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT o.*, 
                   u.full_name as customer_name, u.email as customer_email,
                   json_agg(
                       json_build_object(
                           'id', oi.id,
                           'quantity', oi.quantity,
                           'unit_price', oi.unit_price,
                           'style', oi.style,
                           'product', json_build_object('name', p.name, 'image_url', p.image_url, 'variants', p.variants)
                       )
                   ) as order_items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY o.id, u.id
            ORDER BY o.created_at DESC
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch single order by ID
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT o.*, 
                   u.full_name as customer_name, u.email as customer_email,
                   json_agg(
                       json_build_object(
                           'id', oi.id,
                           'quantity', oi.quantity,
                           'unit_price', oi.unit_price,
                           'style', oi.style,
                           'product', json_build_object('name', p.name, 'image_url', p.image_url, 'variants', p.variants)
                       )
                   ) as order_items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = $1
            GROUP BY o.id, u.id
        `;
        const result = await query(sql, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status (Admin)
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowed = ['pending', 'processing', 'shipped', 'cancelled', 'completed'];

        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid order status value.' });
        }

        const result = await query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete order (Admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        res.json({ message: 'Order deleted successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import express from 'express';
import { query } from '../config/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin Dashboard Summary Stats
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
    try {
        const [ordersRes, productsRes, customersRes] = await Promise.all([
            query('SELECT id, total_amount, status, created_at FROM orders ORDER BY created_at ASC'),
            query('SELECT COUNT(*) as count FROM products'),
            query(SELECT COUNT(*) as count FROM users WHERE role = 'customer')
        ]);

        const orders = ordersRes.rows;
        const totalSales = orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const productsCount = parseInt(productsRes.rows[0].count, 10);
        const customersCount = parseInt(customersRes.rows[0].count, 10);

        // Group daily sales
        const salesByDate = {};
        orders.forEach(o => {
            if (o.status !== 'cancelled') {
                const dateKey = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                salesByDate[dateKey] = (salesByDate[dateKey] || 0) + parseFloat(o.total_amount || 0);
            }
        });

        const chartData = Object.keys(salesByDate).map(date => ({
            date,
            sales: Math.round(salesByDate[date])
        }));

        res.json({
            totalSales,
            ordersCount: orders.length,
            pendingOrders,
            productsCount,
            customersCount,
            chartData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Customers List with aggregates
router.get('/customers', verifyToken, requireAdmin, async (req, res) => {
    try {
        const sql = 
            SELECT 
                u.id, u.email, u.full_name, u.role, u.created_at,
                COUNT(o.id) as orders_count,
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent,
                MAX(o.created_at) as last_order_at
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        ;
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Update customer role (Admin)
router.put('/customers/:id/role', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['admin', 'customer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role.' });
        }
        const result = await query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role', [role, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete customer (Admin)
router.delete('/customers/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import express from 'express';
import { query } from '../config/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Fetch products with optional filters
router.get('/', async (req, res) => {
    try {
        const { activeOnly, category, search, style, limit, offset } = req.query;
        let whereClauses = [];
        let params = [];
        let counter = 1;

        if (activeOnly === 'true') {
            whereClauses.push('is_active = TRUE');
        }

        if (category) {
            whereClauses.push('category = $' + counter++);
            params.push(category);
        }

        if (style) {
            whereClauses.push('style = $' + counter++);
            params.push(style);
        }

        if (search) {
            whereClauses.push('(name ILIKE $' + counter + ' OR description ILIKE $' + counter + ' OR brand ILIKE $' + counter + ')');
            params.push('%' + search + '%');
            counter++;
        }

        let sql = 'SELECT * FROM products';
        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }
        sql += ' ORDER BY created_at DESC';

        if (limit) {
            sql += ' LIMIT $' + counter++;
            params.push(parseInt(limit, 10));
        }

        if (offset) {
            sql += ' OFFSET $' + counter++;
            params.push(parseInt(offset, 10));
        }

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[Products GET Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Fetch single product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create product (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const p = req.body;
        const columns = [
            'name', 'description', 'price', 'stock_quantity', 'category',
            'image_url', 'images', 'is_active', 'style', 'brand',
            'frame_material', 'lens_material', 'lens_technology', 'lens_color',
            'frame_color', 'color', 'frame_width', 'lens_width', 'bridge_width',
            'temple_length', 'face_shape', 'spec_frame', 'spec_lens',
            'spec_hardware', 'spec_weight', 'shipping_info', 'variants'
        ];

        const placeholders = [];
        const values = [];
        let counter = 1;

        for (const col of columns) {
            placeholders.push('$' + counter++);
            let val = p[col];
            if (col === 'variants') {
                val = typeof val === 'object' ? JSON.stringify(val) : (val || '[]');
            } else if (col === 'images') {
                val = Array.isArray(val) ? val : (val ? [val] : []);
            } else if (col === 'is_active') {
                val = val !== undefined ? val : true;
            } else if (val === undefined) {
                val = null;
            }
            values.push(val);
        }

        const sql = 'INSERT INTO products (' + columns.join(', ') + ') VALUES (' + placeholders.join(', ') + ') RETURNING *';
        const result = await query(sql, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[Product Create Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update product (Admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;

        const allowedCols = [
            'name', 'description', 'price', 'stock_quantity', 'category',
            'image_url', 'images', 'is_active', 'style', 'brand',
            'frame_material', 'lens_material', 'lens_technology', 'lens_color',
            'frame_color', 'color', 'frame_width', 'lens_width', 'bridge_width',
            'temple_length', 'face_shape', 'spec_frame', 'spec_lens',
            'spec_hardware', 'spec_weight', 'shipping_info', 'variants'
        ];

        const updates = [];
        const values = [];
        let counter = 1;

        for (const col of allowedCols) {
            if (p[col] !== undefined) {
                updates.push(col + ' = $' + counter++);
                let val = p[col];
                if (col === 'variants') {
                    val = typeof val === 'object' ? JSON.stringify(val) : val;
                } else if (col === 'images') {
                    val = Array.isArray(val) ? val : [val];
                }
                values.push(val);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update.' });
        }

        values.push(id);
        const sql = 'UPDATE products SET ' + updates.join(', ') + ' WHERE id = $' + counter + ' RETURNING *';
        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Product Update Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete product (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json({ message: 'Product deleted successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

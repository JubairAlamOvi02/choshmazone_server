import express from 'express';
import { query } from '../config/db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Fetch reviews for product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const sql = `
            SELECT r.*, 
                   COALESCE(r.user_name, u.full_name, 'Verified Customer') as reviewer_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC
        `;
        const result = await query(sql, [productId]);
        
        const mapped = result.rows.map(r => ({
            ...r,
            profiles: { full_name: r.reviewer_name }
        }));

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit review
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { product_id, rating, comment, user_name } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!product_id || !rating) {
            return res.status(400).json({ error: 'Product ID and rating are required.' });
        }

        const sql = `
            INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await query(sql, [
            product_id,
            userId,
            user_name || (req.user ? req.user.full_name : 'Customer'),
            parseInt(rating, 10),
            comment || ''
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

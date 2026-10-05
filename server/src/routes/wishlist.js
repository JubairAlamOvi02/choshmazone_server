import express from 'express';
import { query } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user wishlist
router.get('/', verifyToken, async (req, res) => {
    try {
        const sql = 
            SELECT w.id as wishlist_id, w.created_at, p.*
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = 
            ORDER BY w.created_at DESC
        ;
        const result = await query(sql, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to wishlist
router.post('/:productId', verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const sql = 
            INSERT INTO wishlist (user_id, product_id)
            VALUES (, )
            ON CONFLICT (user_id, product_id) DO NOTHING
            RETURNING *
        ;
        const result = await query(sql, [req.user.id, productId]);
        res.status(201).json(result.rows[0] || { message: 'Already in wishlist' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove from wishlist
router.delete('/:productId', verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const sql = 'DELETE FROM wishlist WHERE user_id =  AND product_id =  RETURNING *';
        const result = await query(sql, [req.user.id, productId]);
        res.json({ message: 'Removed from wishlist', removed: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

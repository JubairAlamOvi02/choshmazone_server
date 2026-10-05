import express from 'express';
import { query } from '../config/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all site settings
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT key, value, updated_at FROM site_settings');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single setting by key
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const result = await query('SELECT key, value, updated_at FROM site_settings WHERE key = $1', [key]);
        if (result.rows.length === 0) {
            return res.json({ key, value: null });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set or upsert setting (Admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) {
            return res.status(400).json({ error: 'Setting key is required.' });
        }

        const strValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');

        const sql = `
            INSERT INTO site_settings (key, value, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = NOW()
            RETURNING *
        `;
        const result = await query(sql, [key, strValue]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

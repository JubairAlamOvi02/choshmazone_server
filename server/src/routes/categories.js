import express from 'express';
import { query } from '../config/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const { activeOnly } = req.query;
        let sql = 'SELECT * FROM categories';
        if (activeOnly === 'true') {
            sql += ' WHERE is_active = TRUE';
        }
        sql += ' ORDER BY name ASC';
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create category (Admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug, description, image_url, is_active } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required.' });
        }

        const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const active = is_active !== undefined ? is_active : true;

        const result = await query(
            'INSERT INTO categories (name, slug, description, image_url, is_active) VALUES (, , , , ) RETURNING *',
            [name, generatedSlug, description || null, image_url || null, active]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update category (Admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image_url, is_active } = req.body;

        const updates = [];
        const values = [];
        let counter = 1;

        if (name !== undefined) { updates.push(
ame = {counter++}); values.push(name); }
        if (slug !== undefined) { updates.push(slug = {counter++}); values.push(slug); }
        if (description !== undefined) { updates.push(description = {counter++}); values.push(description); }
        if (image_url !== undefined) { updates.push(image_url = {counter++}); values.push(image_url); }
        if (is_active !== undefined) { updates.push(is_active = {counter++}); values.push(is_active); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields provided.' });
        }

        values.push(id);
        const sql = UPDATE categories SET  WHERE id = {counter} RETURNING *;
        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete category (Admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM categories WHERE id =  RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }
        res.json({ message: 'Category deleted successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

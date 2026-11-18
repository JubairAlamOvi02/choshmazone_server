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

        if (req.query.ids) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validIds = String(req.query.ids).split(',').map(s => s.trim()).filter(s => isUUID.test(s));
            if (validIds.length > 0) {
                whereClauses.push('id = ANY($' + counter++ + '::uuid[])');
                params.push(validIds);
            } else {
                whereClauses.push('1 = 0');
            }
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

// Bulk import products from JSON or CSV array (Admin only)
router.post('/bulk-import', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { products: rawProducts, overwrite = true } = req.body;
        if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
            return res.status(400).json({ error: 'Please provide an array of products to import.' });
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let insertedCount = 0;
        let updatedCount = 0;
        const errorList = [];

        const columns = [
            'name', 'description', 'price', 'stock_quantity', 'category',
            'image_url', 'images', 'is_active', 'style', 'brand',
            'frame_material', 'lens_material', 'lens_technology', 'lens_color',
            'frame_color', 'color', 'frame_width', 'lens_width', 'bridge_width',
            'temple_length', 'face_shape', 'spec_frame', 'spec_lens',
            'spec_hardware', 'spec_weight', 'shipping_info', 'variants'
        ];

        for (let i = 0; i < rawProducts.length; i++) {
            const p = rawProducts[i];
            try {
                if (!p.name && !p.title) {
                    throw new Error(`Product at row ${i + 1} has no name/title.`);
                }

                const name = p.name || p.title;
                const price = parseFloat(p.price) || 0;
                const stock = parseInt(p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0), 10) || 0;
                const isActive = p.is_active !== undefined ? Boolean(p.is_active) : true;

                let images = [];
                if (Array.isArray(p.images)) {
                    images = p.images.filter(Boolean);
                } else if (typeof p.images === 'string') {
                    try {
                        const parsed = JSON.parse(p.images);
                        if (Array.isArray(parsed)) images = parsed;
                    } catch {
                        images = p.images.split(/[,|;]/).map(s => s.trim()).filter(Boolean);
                    }
                }
                const imageUrl = p.image_url || images[0] || null;
                if (imageUrl && !images.includes(imageUrl)) {
                    images.unshift(imageUrl);
                }

                let variants = '[]';
                if (Array.isArray(p.variants)) {
                    variants = JSON.stringify(p.variants);
                } else if (typeof p.variants === 'object' && p.variants !== null) {
                    variants = JSON.stringify(p.variants);
                } else if (typeof p.variants === 'string') {
                    variants = p.variants.trim() || '[]';
                }

                const hasValidUUID = p.id && isUUID.test(String(p.id).trim());
                const productUUID = hasValidUUID ? String(p.id).trim() : null;

                const valuesMap = {
                    name,
                    description: p.description || '',
                    price,
                    stock_quantity: stock,
                    category: p.category || '',
                    image_url: imageUrl,
                    images,
                    is_active: isActive,
                    style: p.style || '',
                    brand: p.brand || '',
                    frame_material: p.frame_material || '',
                    lens_material: p.lens_material || '',
                    lens_technology: p.lens_technology || '',
                    lens_color: p.lens_color || '',
                    frame_color: p.frame_color || '',
                    color: p.color || '',
                    frame_width: p.frame_width || '',
                    lens_width: p.lens_width || '',
                    bridge_width: p.bridge_width || '',
                    temple_length: p.temple_length || '',
                    face_shape: p.face_shape || '',
                    spec_frame: p.spec_frame || '',
                    spec_lens: p.spec_lens || '',
                    spec_hardware: p.spec_hardware || '',
                    spec_weight: p.spec_weight || '',
                    shipping_info: p.shipping_info || '',
                    variants
                };

                if (productUUID) {
                    if (overwrite) {
                        const allCols = ['id', ...columns];
                        const placeholders = allCols.map((_, idx) => `$${idx + 1}`);
                        const values = [productUUID, ...columns.map(c => valuesMap[c])];
                        const updateSet = columns.map(c => `${c} = EXCLUDED.${c}`).join(', ');

                        const sql = `
                            INSERT INTO products (${allCols.join(', ')})
                            VALUES (${placeholders.join(', ')})
                            ON CONFLICT (id) DO UPDATE SET ${updateSet}
                            RETURNING (xmax = 0) AS is_insert
                        `;
                        const resDb = await query(sql, values);
                        if (resDb.rows[0]?.is_insert) {
                            insertedCount++;
                        } else {
                            updatedCount++;
                        }
                    } else {
                        const allCols = ['id', ...columns];
                        const placeholders = allCols.map((_, idx) => `$${idx + 1}`);
                        const values = [productUUID, ...columns.map(c => valuesMap[c])];
                        const sql = `
                            INSERT INTO products (${allCols.join(', ')})
                            VALUES (${placeholders.join(', ')})
                            ON CONFLICT (id) DO NOTHING
                            RETURNING id
                        `;
                        const resDb = await query(sql, values);
                        if (resDb.rows.length > 0) {
                            insertedCount++;
                        }
                    }
                } else {
                    const placeholders = columns.map((_, idx) => `$${idx + 1}`);
                    const values = columns.map(c => valuesMap[c]);
                    const sql = `
                        INSERT INTO products (${columns.join(', ')})
                        VALUES (${placeholders.join(', ')})
                        RETURNING id
                    `;
                    await query(sql, values);
                    insertedCount++;
                }
            } catch (itemErr) {
                console.error(`Error importing product ${p.name || i}:`, itemErr.message);
                errorList.push({ index: i, name: p.name || `Row ${i + 1}`, error: itemErr.message });
            }
        }

        res.json({
            success: true,
            totalSubmitted: rawProducts.length,
            inserted: insertedCount,
            updated: updatedCount,
            errorsCount: errorList.length,
            errors: errorList
        });
    } catch (err) {
        console.error('[Bulk Import Error]:', err);
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

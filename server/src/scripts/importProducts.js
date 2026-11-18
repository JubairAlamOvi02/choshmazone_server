import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RFC 4180 CSV parser
function parseCsv(text) {
    const lines = [];
    let curLine = [];
    let curCell = '';
    let inQuotes = false;
    const cleanText = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < cleanText.length; i++) {
        const c = cleanText[i];
        const next = cleanText[i + 1];

        if (c === '"') {
            if (inQuotes && next === '"') {
                curCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            curLine.push(curCell);
            curCell = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') i++;
            curLine.push(curCell);
            curCell = '';
            if (curLine.length > 0 && curLine.some(cell => cell.trim().length > 0)) {
                lines.push(curLine);
            }
            curLine = [];
        } else {
            curCell += c;
        }
    }

    if (curCell.length > 0 || curLine.length > 0) {
        curLine.push(curCell);
        if (curLine.some(cell => cell.trim().length > 0)) lines.push(curLine);
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim().toLowerCase());
    const results = [];

    for (let r = 1; r < lines.length; r++) {
        const row = lines[r];
        const obj = {};
        for (let col = 0; col < headers.length; col++) {
            obj[headers[col]] = row[col] !== undefined ? row[col] : '';
        }
        results.push(obj);
    }
    return results;
}

export async function importProductsFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    console.log(`\n======================================================`);
    console.log(`📦 Importing products from: ${filePath}`);
    console.log(`======================================================`);

    const content = fs.readFileSync(filePath, 'utf8');
    let products = [];

    if (filePath.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const parsed = JSON.parse(content);
        products = Array.isArray(parsed) ? parsed : (parsed.products || []);
    } else {
        products = parseCsv(content);
    }

    console.log(`🔍 Detected ${products.length} products to import.`);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    const columns = [
        'name', 'description', 'price', 'stock_quantity', 'category',
        'image_url', 'images', 'is_active', 'style', 'brand',
        'frame_material', 'lens_material', 'lens_technology', 'lens_color',
        'frame_color', 'color', 'frame_width', 'lens_width', 'bridge_width',
        'temple_length', 'face_shape', 'spec_frame', 'spec_lens',
        'spec_hardware', 'spec_weight', 'shipping_info', 'variants'
    ];

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        try {
            const name = p.name || p.title;
            if (!name) continue;

            const price = parseFloat(p.price) || 0;
            const stock = parseInt(p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0), 10) || 0;
            const isActive = p.is_active !== undefined ? (String(p.is_active) === 'true' || p.is_active === true) : true;

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
                    inserted++;
                } else {
                    updated++;
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
                inserted++;
            }
        } catch (err) {
            console.error(`❌ Failed on row ${i + 1} (${p.name || 'unnamed'}):`, err.message);
            failed++;
        }
    }

    console.log(`\n======================================================`);
    console.log(`✅ Import finished successfully!`);
    console.log(`   - Total Inserted: ${inserted}`);
    console.log(`   - Total Updated:  ${updated}`);
    console.log(`   - Total Failed:   ${failed}`);
    console.log(`======================================================\n`);
}

// CLI execution: node src/scripts/importProducts.js [file]
const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirect) {
    const candidateFiles = [
        process.argv[2],
        path.resolve(__dirname, '../../../products_export.json'),
        path.resolve(__dirname, '../../../products_export.csv'),
        path.resolve(__dirname, '../../products_export.json'),
        path.resolve(__dirname, '../../products_export.csv')
    ].filter(Boolean);

    const found = candidateFiles.find(f => fs.existsSync(f));
    if (!found) {
        console.error('❌ Could not find an export file to import. Please specify path:');
        console.error('   node src/scripts/importProducts.js <path-to-file.json or .csv>');
        process.exit(1);
    }

    importProductsFromFile(found)
        .then(() => pool.end())
        .catch(err => {
            console.error('Fatal error during import:', err);
            pool.end();
            process.exit(1);
        });
}

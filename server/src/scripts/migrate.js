import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration() {
    console.log('[Migration] Verifying/running PostgreSQL schema migration...');
    const schemaPath = path.resolve(__dirname, '../../schema.sql');
    if (!fs.existsSync(schemaPath)) {
        console.warn('⚠️ [Migration] schema.sql not found at:', schemaPath);
        return;
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');

    try {
        await pool.query(sql);
        console.log('✅ [Migration] Database schema migrated/verified successfully!');

        // Explicitly ensure default admin account exists
        const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@choshmazone.com'");
        if (adminCheck.rows.length === 0) {
            console.log('[Migration] Creating default admin account (admin@choshmazone.com)...');
            const defaultIdCheck = await pool.query("SELECT id FROM users WHERE id = '00000000-0000-0000-0000-000000000001'");
            if (defaultIdCheck.rows.length > 0) {
                await pool.query(`
                    UPDATE users 
                    SET email = 'admin@choshmazone.com',
                        password_hash = '$2b$10$ETnEkUcMU.12fx3mgfFe2uV.ewQjqV5OznOmy8ryoNRvN8FPOtxhm',
                        role = 'admin'
                    WHERE id = '00000000-0000-0000-0000-000000000001'
                `);
            } else {
                await pool.query(`
                    INSERT INTO users (email, password_hash, full_name, role)
                    VALUES (
                        'admin@choshmazone.com',
                        '$2b$10$ETnEkUcMU.12fx3mgfFe2uV.ewQjqV5OznOmy8ryoNRvN8FPOtxhm',
                        'Admin User',
                        'admin'
                    ) ON CONFLICT (email) DO NOTHING
                `);
            }
            console.log('✅ [Migration] Default admin account seeded successfully!');
        }
    } catch (err) {
        console.error('❌ [Migration] Migration failed:', err.message);
        throw err;
    }
}

// If executed directly from CLI: node src/scripts/migrate.js
const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectExecution) {
    runMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

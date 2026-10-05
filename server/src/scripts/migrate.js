import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('[Migration] Starting PostgreSQL schema migration...');
    const schemaPath = path.resolve(__dirname, '../../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    try {
        await pool.query(sql);
        console.log('✅ [Migration] Database schema migrated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ [Migration] Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();

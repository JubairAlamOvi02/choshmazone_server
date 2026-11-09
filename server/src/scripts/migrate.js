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

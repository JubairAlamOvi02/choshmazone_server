import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

async function resetAdmin() {
    console.log('[Admin Reset] Setting admin user credentials...');
    const email = 'admin@choshmazone.com';
    const password = 'admin123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    try {
        const res = await query(
            `INSERT INTO users (id, email, password_hash, full_name, role)
             VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, 'Admin User', 'admin')
             ON CONFLICT (email) 
             DO UPDATE SET 
                password_hash = $2,
                role = 'admin'
             RETURNING id, email, role;`,
            [email, hash]
        );

        console.log('====================================================');
        console.log('✅ Admin Account Ready:');
        console.log(`   Email:    ${res.rows[0].email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role:     ${res.rows[0].role}`);
        console.log('====================================================');
    } catch (err) {
        console.error('❌ Failed to reset admin user:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

resetAdmin();

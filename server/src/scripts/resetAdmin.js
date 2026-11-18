import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

async function resetAdmin() {
    console.log('[Admin Reset] Setting admin user credentials...');
    const email = 'admin@choshmazone.com';
    const password = 'admin123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    try {
        // 1. Try updating existing admin row by email
        let res = await query(
            "UPDATE users SET password_hash = $1, role = 'admin' WHERE email = $2 RETURNING id, email, role",
            [hash, email]
        );

        // 2. If not found by email, try updating row with default UUID
        if (res.rows.length === 0) {
            res = await query(
                "UPDATE users SET email = $1, password_hash = $2, role = 'admin' WHERE id = '00000000-0000-0000-0000-000000000001' RETURNING id, email, role",
                [email, hash]
            );
        }

        // 3. If neither exists, insert a brand new row (letting Postgres generate a UUID)
        if (res.rows.length === 0) {
            res = await query(
                "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, 'Admin User', 'admin') RETURNING id, email, role",
                [email, hash]
            );
        }

        // List all users in database
        const allUsers = await query('SELECT id, email, role, full_name FROM users');

        console.log('\n====================================================');
        console.log('✅ Admin Account Ready!');
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);
        console.log('====================================================');
        console.log('📋 All Registered Users in Database:');
        console.table(allUsers.rows);
    } catch (err) {
        console.error('❌ Failed to reset admin user:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

resetAdmin();

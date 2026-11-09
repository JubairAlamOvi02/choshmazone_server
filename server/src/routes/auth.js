import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'choshmazone_jwt_super_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Register customer
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at',
            [normalizedEmail, password_hash, full_name || '', 'customer']
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('[Auth Register Error]:', err);
        res.status(500).json({ error: err.message || 'Registration failed.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const userPayload = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            created_at: user.created_at
        };

        const token = generateToken(userPayload);
        res.json({ user: userPayload, token });
    } catch (err) {
        console.error('[Auth Login Error]:', err);
        res.status(500).json({ error: err.message || 'Login failed.' });
    }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await query('SELECT id, email, full_name, role, created_at FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile (Name, Email, Password)
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { full_name, email, current_password, new_password, password } = req.body;
        const userId = req.user.id;

        // Fetch current user from database
        const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentUser = userRes.rows[0];

        const updates = [];
        const values = [];
        let counter = 1;

        if (full_name !== undefined) {
            updates.push(`full_name = $${counter++}`);
            values.push(full_name.trim());
        }

        // Email update
        if (email && email.trim().toLowerCase() !== currentUser.email) {
            const normalizedEmail = email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({ error: 'Please enter a valid email address.' });
            }

            // Check if email already in use
            const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [normalizedEmail, userId]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'This email address is already in use by another account.' });
            }

            updates.push(`email = $${counter++}`);
            values.push(normalizedEmail);
        }

        // Password update
        const targetNewPassword = new_password || password;
        if (targetNewPassword) {
            if (targetNewPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
            }

            // If current_password is provided, check it
            if (current_password) {
                const isMatch = await bcrypt.compare(current_password, currentUser.password_hash);
                if (!isMatch) {
                    return res.status(400).json({ error: 'Current password is incorrect.' });
                }
            }

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(targetNewPassword, salt);
            updates.push(`password_hash = $${counter++}`);
            values.push(password_hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update provided.' });
        }

        values.push(userId);
        const q = `UPDATE users SET ${updates.join(', ')} WHERE id = $${counter} RETURNING id, email, full_name, role, created_at`;
        const result = await query(q, values);
        const updatedUser = result.rows[0];

        // Generate fresh JWT token with updated email & name
        const token = generateToken(updatedUser);

        res.json({
            message: 'Account details updated successfully!',
            user: updatedUser,
            token
        });
    } catch (err) {
        console.error('[Profile Update Error]:', err);
        res.status(500).json({ error: err.message || 'Failed to update account.' });
    }
});

export default router;

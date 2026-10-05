import express from 'express';
import { query } from '../config/db.js';
import { optionalAuth, verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Register or update visitor session
router.post('/session', optionalAuth, async (req, res) => {
    try {
        const {
            session_id, visitor_id, first_page, last_page, referrer,
            device_type, browser, operating_system, ip_address,
            city, region, country, isp
        } = req.body;

        if (!session_id || !visitor_id) {
            return res.status(400).json({ error: 'session_id and visitor_id are required.' });
        }

        const userId = req.user ? req.user.id : null;

        const sql = 
            INSERT INTO visitor_sessions (
                id, visitor_id, user_id, first_page, last_page, referrer,
                device_type, browser, operating_system, ip_address,
                city, region, country, isp, started_at, last_active_at, page_views_count
            ) VALUES (
                , , , , , , , , , , , , , , NOW(), NOW(), 1
            )
            ON CONFLICT (id) DO UPDATE SET
                last_page = COALESCE(EXCLUDED.last_page, visitor_sessions.last_page),
                user_id = COALESCE(EXCLUDED.user_id, visitor_sessions.user_id),
                last_active_at = NOW(),
                page_views_count = visitor_sessions.page_views_count + 1
            RETURNING *
        ;

        const result = await query(sql, [
            session_id, visitor_id, userId, first_page || '/', last_page || '/',
            referrer || '', device_type || 'desktop', browser || '',
            operating_system || '', ip_address || '', city || '',
            region || '', country || '', isp || ''
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Analytics Session Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Record web event
router.post('/event', optionalAuth, async (req, res) => {
    try {
        const { session_id, visitor_id, event_type, path, page_title, metadata, device_type } = req.body;
        if (!session_id || !visitor_id || !event_type) {
            return res.status(400).json({ error: 'Missing required event fields.' });
        }

        const userId = req.user ? req.user.id : null;
        const metaJson = typeof metadata === 'object' ? JSON.stringify(metadata) : '{}';

        // 1. Insert event
        const eventSql = 
            INSERT INTO web_events (session_id, visitor_id, user_id, event_type, path, page_title, metadata, device_type)
            VALUES (, , , , , , , )
            RETURNING *
        ;
        const eventRes = await query(eventSql, [
            session_id, visitor_id, userId, event_type, path || '/',
            page_title || '', metaJson, device_type || 'desktop'
        ]);

        // 2. Update session funnel flags
        const updateFlags = [];
        const params = [session_id];
        let counter = 2;

        if (event_type === 'view_product') updateFlags.push('has_viewed_product = TRUE');
        if (event_type === 'add_to_cart') updateFlags.push('has_added_to_cart = TRUE');
        if (event_type === 'initiate_checkout') updateFlags.push('has_initiated_checkout = TRUE');
        if (event_type === 'purchase') {
            updateFlags.push('has_purchased = TRUE');
            if (metadata && metadata.total_amount) {
                updateFlags.push(	otal_purchased_amount = {counter++});
                params.push(metadata.total_amount);
            }
            if (metadata && metadata.order_id) {
                updateFlags.push(order_id = {counter++});
                params.push(metadata.order_id);
            }
        }

        if (updateFlags.length > 0) {
            updateFlags.push('last_active_at = NOW()');
            const sessionSql = UPDATE visitor_sessions SET  WHERE id = ;
            await query(sessionSql, params);
        }

        res.status(201).json(eventRes.rows[0]);
    } catch (err) {
        console.error('[Analytics Event Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get sessions
router.get('/sessions', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, limit = 500 } = req.query;
        let sql = 'SELECT * FROM visitor_sessions';
        const params = [];
        if (startDate) {
            sql += ' WHERE started_at >= ';
            params.push(startDate);
        }
        sql +=  ORDER BY started_at DESC LIMIT {params.length + 1};
        params.push(parseInt(limit, 10));

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get events
router.get('/events', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, limit = 300 } = req.query;
        let sql = 'SELECT * FROM web_events';
        const params = [];
        if (startDate) {
            sql += ' WHERE created_at >= ';
            params.push(startDate);
        }
        sql +=  ORDER BY created_at DESC LIMIT {params.length + 1};
        params.push(parseInt(limit, 10));

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

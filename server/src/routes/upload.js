import express from 'express';
import { upload } from '../middleware/upload.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Upload single file (Admin)
router.post('/', verifyToken, requireAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const relativeUrl = /uploads/;
    res.json({
        url: relativeUrl,
        filename: req.file.filename,
        size: req.file.size
    });
});

// Upload multiple files (Admin)
router.post('/multiple', verifyToken, requireAdmin, upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded.' });
    }
    const urls = req.files.map(f => /uploads/);
    res.json({ urls });
});

export default router;

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase() || '.webp';
        cb(null, 'cz-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'
    ];
    if (allowedMimes.includes(file.mimetype) || /\.(mp4|webm|mov|ogg)$/i.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files (JPEG, PNG, WEBP, GIF, SVG, MP4, WEBM, MOV, OGG) are allowed.'), false);
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for videos & media
    fileFilter
});

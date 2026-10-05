import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Route imports
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import ordersRouter from './routes/orders.js';
import settingsRouter from './routes/settings.js';
import reviewsRouter from './routes/reviews.js';
import analyticsRouter from './routes/analytics.js';
import adminRouter from './routes/admin.js';
import wishlistRouter from './routes/wishlist.js';
import uploadRouter from './routes/upload.js';
import catalogRouter from './routes/catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static directory for uploaded files (product images, banners)
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), server: 'choshmazone-custom-vps' });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/catalog.xml', catalogRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Unhandled Error]:', err.stack || err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================');
    console.log(`🚀 Choshmazone Backend running on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`📁 Uploads served at: http://localhost:${PORT}/uploads`);
    console.log('===============================================');
});

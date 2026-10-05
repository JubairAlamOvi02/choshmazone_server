# Choshmazone (Self-Hosted VPS Edition)

This is the standalone, self-hosted edition of **Choshmazone** designed specifically to run without **Vercel** and without **Supabase**, running 100% on your **Hostinger KVM 1 VPS** (or any Ubuntu server) using **Node.js, Express, and PostgreSQL**.

---

## 📁 Project Structure

```
choshmazone_server/
├── client/                     # Frontend: React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── lib/apiClient.js    # Native REST API client (replaces Supabase SDK)
│   │   ├── lib/api/            # Modular API callers (products, orders, categories, settings, reviews)
│   │   ├── context/            # AuthContext, CartContext, WishlistContext (REST-powered)
│   │   └── ...                 # Identical components, styling, and UI from original app
│   ├── vite.config.js          # Configured with proxy to localhost:5000 for local dev
│   └── package.json
│
├── server/                     # Backend: Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── config/db.js        # PostgreSQL Connection Pool (pg)
│   │   ├── middleware/         # JWT Auth and Multer Image Upload middlewares
│   │   ├── routes/             # auth, products, categories, orders, settings, reviews, analytics, upload, catalog
│   │   ├── scripts/migrate.js  # Automatic database migration script
│   │   └── index.js            # Express server entry point
│   ├── uploads/                # Local directory where uploaded product images & banners are stored
│   ├── schema.sql              # Complete PostgreSQL database schema + default admin seeder
│   └── package.json
│
├── ecosystem.config.cjs        # PM2 Process Manager configuration for production VPS
├── nginx.conf.example          # Production Nginx reverse proxy configuration
├── DEPLOYMENT_GUIDE.md         # Complete step-by-step VPS installation & setup guide
└── README.md
```

---

## 💻 Local Development

### 1. Start the Backend Server:
```bash
cd server
npm install
# Ensure PostgreSQL is running locally and set up .env
npm run db:migrate
npm run dev
```
The backend starts on: `http://localhost:5000`

### 2. Start the Frontend Client:
```bash
cd client
npm install
npm run dev
```
The frontend starts on: `http://localhost:5173` (API requests to `/api` and `/uploads` are automatically proxied to `http://localhost:5000`).

---

## 🌐 VPS Production Deployment
Refer to [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full instructions on setting up Ubuntu, Nginx, PostgreSQL, PM2, and free SSL on Hostinger KVM 1.

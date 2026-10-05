# 📊 ChoshmaZone — Project Progress & Status Tracker

This document tracks which features and setup steps are completed, what is in progress, and upcoming tasks.

---

## 🟢 Completed Milestones (Done)

- [x] **Git Repository Setup & Protection**:
  - Initialized Git repository and pushed to `https://github.com/JubairAlamOvi02/choshmazone_server.git`.
  - Added comprehensive root `.gitignore` to prevent leaking `.env` secrets, API tokens, and `dist` build folders.
  - Root `package.json` created with convenience scripts (`npm run dev`, `npm run dev:server`, `npm run install:all`).

- [x] **Complete Supabase & Vercel Decoupling**:
  - Completely migrated away from paid cloud services (Supabase & Vercel) to self-hosted Node.js + Express + PostgreSQL.
  - Replaced Supabase SDK in frontend with a native fetch client (`client/src/lib/apiClient.js`).
  - Added compatibility fallback in `supabaseClient.js` to ensure legacy references don't throw runtime errors.

- [x] **Backend Server & REST API**:
  - Custom Express API created with route modules: Auth, Products, Categories, Orders, Settings, Reviews, Analytics, Uploads, and Facebook/Google Catalog XML.
  - JWT authentication and role-based middleware (`verifyToken`, `requireAdmin`, `optionalAuth`).
  - Multer static image upload pipeline storing files directly in `server/uploads`.
  - PostgreSQL migration scripts (`server/schema.sql`, `server/src/scripts/migrate.js`) with default admin seeder.
  - Fixed syntax errors and parameterized queries ($1, $2) across all backend route controllers.

- [x] **Frontend Client & UI Polish**:
  - React 19 SPA with Tailwind CSS v4 styling.
  - Dynamic Lens Customizer modal for prescription glasses.
  - Dynamic cart drawer, checkout form with Cash on Delivery (COD) support.
  - Order tracking system by Phone number or Order UUID.
  - Admin dashboard, product manager, category manager, order manager, media manager, and customer role manager.
  - **Fixed React Error Boundary**: Implemented missing `getCached`, `fetchAll`, and `listAssets` in `client/src/lib/api/settings.js`.
  - **Updated Brand Tagline**: Updated to `"Premium eyewear, Stylish look আর Clear vision — সব একসাথে।"` across Hero banner, Admin Media Manager, and SEO/OpenGraph meta tags.

---

## 🟡 Current State (In Development / Local Testing)

- **Local Frontend**: Active on `http://localhost:5173`.
- **Local Backend**: Active on `http://localhost:5000` (`/api/health` returns `status: ok`).
- **Local Database**: Standalone PostgreSQL instance required on `localhost:5432` if testing live DB queries locally, otherwise ready for VPS deployment.

---

## 🔵 Upcoming Tasks & Next Steps (To Do)

- [ ] **VPS Setup & Initial Deployment**:
  - SSH into Hostinger KVM 1 VPS.
  - Install Node.js 20, Nginx, PostgreSQL, and PM2.
  - Clone repository to `/var/www/choshmazone`.
  - Run database migration on production PostgreSQL.
  - Configure Nginx reverse proxy and obtain free SSL via Certbot.
- [ ] **Live Testing & Verification**:
  - Test guest checkout and order notification dispatch to Telegram Bot.
  - Verify Google Sheets sync webhook on live VPS.
  - Log in to Admin portal (`admin@choshmazone.com`) and upload initial product catalog.
  - Verify Facebook Catalog Feed URL (`https://yourdomain.com/api/catalog.xml`).
- [ ] **Optional Enhancements**:
  - Add SSL renewal auto-check via cron job.
  - Set up automated database daily backup script with `pg_dump`.

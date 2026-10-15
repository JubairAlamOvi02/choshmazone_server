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
  - Added enhanced compatibility fallback in `supabaseClient.js` with stubbed channels and auto-mapped upload and query capabilities.

- [x] **Backend Server & REST API**:
  - Custom Express API created with route modules: Auth, Products, Categories, Orders, Settings, Reviews, Analytics, Uploads, and Facebook/Google Catalog XML.
  - JWT authentication and role-based middleware (`verifyToken`, `requireAdmin`, `optionalAuth`).
  - Multer upload pipeline supporting both high-resolution photography and MP4/WebM videos up to 100MB, stored in `server/uploads`. Added dedicated `/api/upload/prescription` endpoint for public checkout prescription slip uploads.
  - PostgreSQL migration scripts (`server/schema.sql`, `server/src/scripts/migrate.js`) with default admin seeder.
  - Enhanced `order_items` table with `selected_color`, `selected_size`, and `variant_id` columns with idempotent migrations.

- [x] **ChoshmaZone Spotlight Video & Image Brand Storytelling Engine**:
  - Built `SpotlightManager.jsx` at `/admin/spotlight` enabling administrators to curate visual brand campaigns, embedded MP4/WebM videos, and lifestyle photography.
  - Developed `ChoshmaZoneSpotlight.jsx` on the homepage (`Home.jsx`) with dynamic video player modals, auto-play/mute controls, product pill links, and responsive card layouts.
  - Settings persistence via `getChoshmazoneSection()` and `saveChoshmazoneSection()` in `src/lib/api/settings.js`.
  - Registered `/admin/spotlight` route and sidebar navigation in `AdminLayout.jsx`.

- [x] **Recently Viewed Eyewear Real-Time Sync & Showcase**:
  - Redesigned `RecentlyViewed.jsx` (`src/components/RecentlyViewed.jsx`) with responsive grid and carousel presentation.
  - Added `fetchRecentlyViewed` in `products.js` to guarantee real-time price updates, active status verification, and inventory fallback.
  - Added instant "Add to Bag", stock badges ("In Stock" / "Out of Stock"), formatted BDT currency, and thumbnail previews.

- [x] **Multi-Tiered Checkout Stock Validation & Logistics**:
  - Implemented multi-tiered stock verification in `src/pages/Checkout.jsx`: specific variant ID lookup $\rightarrow$ variant color/size matching fallback $\rightarrow$ base product `stock_quantity` fallback.
  - Attached `variant_id`, `selected_color`, and `selected_size` in `ProductDetails.jsx`.
  - Out of Stock modal with partial availability status (`Only X left (ordered Y)`).
  - Complete 64 districts and 500+ thanas integration in `bangladeshLocations.js` covering Steadfast Courier's full delivery reach with fallback.

- [x] **Zero-Cost Instant Phone Push Notifications & Chime Alert**:
  - Integrated **ntfy.sh** push notification engine (`ntfyNotifier.js`) delivering instant high-priority alerts with sound and action buttons (`View Order`, `Call Customer`) to Android and iOS lockscreens.
  - Built hybrid audio engine (`orderSoundNotifier.js`) combining Web Audio API tone synthesis and `/sounds/cha-ching.mp3` for audible "Cha-Ching!" alerts in `AdminLayout.jsx`.
  - Added interactive Telegram Bot notifications with inline buttons (`👁️ View in Admin`, `💬 WhatsApp Customer`).

- [x] **Dynamic Contact Page CMS**:
  - Refactored `/contact` to dynamically render heading, subtitle, showroom address, email support, and hotline number from `site_settings`.
  - Built Section 6 in `MediaManager.jsx` with real-time live preview mirroring the public contact page.
  - Cross-linked from `CheckoutSettings.jsx`.

- [x] **Deployment Documentation & Nginx Configuration**:
  - Fixed syntax and PowerShell variable expansion errors in `nginx.conf.example`.
  - Added 100MB client max body size and byte-range video streaming directives to Nginx configuration.
  - Updated both `DEPLOYMENT_GUIDE.md` and `MemoryBank/deploymentGuide.md` with complete client and server `.env` templates, ntfy.sh setup, and zero-downtime update instructions.

---

## 🟡 Current State (Ready for Deployment)

- **Frontend Client**: Tested and compiles cleanly with `npm run build` (zero errors).
- **Backend Server**: Full feature parity with PostgreSQL migrations and video uploads.
- **Documentation**: Synchronized with Memory Bank and deployment guides.

---

## 🔵 Upcoming Tasks & Next Steps (To Do)

- [ ] **VPS Setup & Initial Deployment**:
  - SSH into Hostinger KVM 1 VPS.
  - Install Node.js 20, Nginx, PostgreSQL, and PM2.
  - Clone repository to `/var/www/choshmazone`.
  - Run database migration on production PostgreSQL (`npm run db:migrate`).
  - Configure Nginx reverse proxy and obtain free SSL via Certbot.
- [ ] **Live Testing & Verification**:
  - Test guest checkout and order notification dispatch to ntfy.sh and Telegram Bot.
  - Verify Google Sheets sync webhook on live VPS.
  - Log in to Admin portal (`admin@choshmazone.com`) and test video/photo uploads in Spotlight Manager (`/admin/spotlight`).
  - Verify Facebook Catalog Feed URL (`https://yourdomain.com/api/catalog.xml`).

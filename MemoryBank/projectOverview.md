# 👓 ChoshmaZone — Project Overview

## 📌 Executive Summary
**ChoshmaZone** is a fullstack, production-grade e-commerce platform dedicated to eyewear and sunglasses in Bangladesh. Originally architected around third-party cloud solutions (Vercel and Supabase), the project has been fully re-engineered to run as a **100% self-hosted, vendor-independent application** on a **Hostinger KVM 1 Ubuntu VPS** (or any Linux server).

---

## 🎯 Business Mission & Tagline
- **Tagline**: *"Premium eyewear, Stylish look আর Clear vision — সব একসাথে।"*
- **Target Market**: Bangladesh eyewear consumers seeking trendy, prescription-ready, authentic eyeglasses and sunglasses.
- **Core Value Propositions**:
  - Free delivery across Bangladesh.
  - 100% authentic frames and premium build quality.
  - Custom prescription lens customizer.
  - 7-day easy exchange policy.
  - Cash on Delivery (COD) and mobile wallet payment workflows.

---

## 🛠️ Core Tech Stack

| Layer | Technology | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS 4 | Fast, modern client SPA with responsive mobile-first UI |
| **Icons & UI** | Lucide React, Leaflet, Recharts | Interactive dashboards, maps, charts, and iconography |
| **Backend** | Node.js (v20+), Express.js (ESM) | High-performance RESTful API server |
| **Database** | PostgreSQL 14+ | Relational data store for products, orders, users, reviews, settings |
| **Process Manager** | PM2 | Daemon manager for zero-downtime execution and auto-restart on boot |
| **Reverse Proxy / Web Server** | Nginx | High-speed static file serving, SSL termination, proxy to Node.js |
| **SSL / Security** | Let's Encrypt (Certbot) | Free, auto-renewing HTTPS certificates |
| **Notifications** | Telegram Bot API | Instant push alerts directly to admin's phone upon new orders |
| **Spreadsheet Sync** | Google Apps Script (Webhook) | Automatic backup of order details into Google Sheets |

---

## 📂 Key Directories

```
choshmazone_server/
├── client/              # React frontend client
├── server/              # Express backend API & PostgreSQL migrations
├── MemoryBank/          # Living project documentation & runbooks
├── ecosystem.config.cjs # PM2 cluster/process configuration
├── nginx.conf.example   # Nginx server block configuration
├── DEPLOYMENT_GUIDE.md  # Comprehensive server setup guide
├── package.json         # Root scripts for multi-package management
└── .gitignore           # Prevents secrets (.env) and builds from leaking
```

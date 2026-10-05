# 💻 ChoshmaZone — Development Workflow & Commands

This guide documents the day-to-day workflow for developing, testing, and managing ChoshmaZone locally.

---

## 🚀 Running Locally

All scripts can now be run from the root directory (`d:\AG_Projects\choshmazone_server`):

| Action | Command | Details |
| :--- | :--- | :--- |
| **Install all packages** | `npm run install:all` | Installs both `client` and `server` dependencies |
| **Start Frontend** | `npm run dev` | Runs Vite dev server at `http://localhost:5173` |
| **Start Backend** | `npm run dev:server` | Runs Express with `node --watch` at `http://localhost:5000` |
| **Build Frontend** | `npm run build` | Builds production bundle into `client/dist/` |

---

## 🔑 Environment Variables Guide

### Client (`client/.env`)
*Note: This file is ignored by Git to protect secrets.*
```env
# Optional overrides for production URLs
VITE_API_BASE_URL=
```

### Server (`server/.env`)
*Create this file locally if you have PostgreSQL installed on your computer:*
```env
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=choshmazone
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=choshmazone_dev_secret_key_12345
BASE_URL=http://localhost:5000

# Telegram & Google Sheets Notifications (Optional in local dev)
TELEGRAM_BOT_TOKEN=8639759587:AAHgCaAwJfu35H2CYTFRhgpRDNYYwt9s8LQ
TELEGRAM_CHAT_ID=2119791189
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxEmGDmu1IRiz9MqKBAnIH_SDfG9GJTIHfbRIipKw5Lb_vC_B9KorTUu6fbpP11ZmNF/exec
```

---

## 🗃️ Database Migrations (PostgreSQL)

Whenever database changes or schema setup are needed:
```powershell
cd server
npm run db:migrate
```
This runs [`server/schema.sql`](file:///d:/AG_Projects/choshmazone_server/server/schema.sql) through [`server/src/scripts/migrate.js`](file:///d:/AG_Projects/choshmazone_server/server/src/scripts/migrate.js).

---

## 🛑 Git & GitHub Workflow (Manual Control)

> **Important**: Antigravity AI will never automatically commit or push code to GitHub. You have complete manual control over Git.

When you are ready to save and push your changes to GitHub:

```powershell
# 1. Check changed files
git status

# 2. Stage your files
git add .

# 3. Commit with a message
git commit -m "Your descriptive message here"

# 4. Push to GitHub
git push origin main
```

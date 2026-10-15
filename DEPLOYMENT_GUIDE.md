# 🚀 Choshmazone Deployment Guide for Hostinger KVM 1 VPS

This complete guide will walk you through setting up and running your **Choshmazone** project (React 19 Frontend + Node.js/Express Backend + PostgreSQL Database) on a fresh **Hostinger KVM 1** Ubuntu VPS (Ubuntu 22.04 or 24.04 LTS).

---

## 📋 System Requirements
- **Server:** Hostinger KVM 1 (1 vCPU, 4 GB RAM, 50 GB NVMe Storage)
- **OS:** Ubuntu 22.04 / 24.04 64-bit
- **Domain:** Your custom domain (e.g. `choshmazone.com`) pointing to your VPS IP address:
  - `A Record: @ -> YOUR_VPS_IP`
  - `A Record: www -> YOUR_VPS_IP`
- **GitHub Repository:** `https://github.com/JubairAlamOvi02/choshmazone_server.git`

---

## Step 1: Connect to Your VPS
Open Terminal / PowerShell on your computer and connect to your server:
```bash
ssh root@YOUR_VPS_IP
```
Update all system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Node.js 20, Git, Nginx, and Build Tools
Install Node.js 20.x LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx build-essential certbot python3-certbot-nginx
```
Install PM2 globally to keep the server running continuously:
```bash
sudo npm install -g pm2
```
Verify installations:
```bash
node -v    # Expected: v20.x.x
npm -v
nginx -v
```

---

## Step 3: Install & Configure PostgreSQL
Install PostgreSQL and its contrib package:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create the database and database user:
```bash
sudo -u postgres psql
```
Inside the PostgreSQL interactive shell, run:
```sql
CREATE DATABASE choshmazone;
CREATE USER choshma_user WITH ENCRYPTED PASSWORD 'ChooseAStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE choshmazone TO choshma_user;
ALTER DATABASE choshmazone OWNER TO choshma_user;
\q
```

---

## Step 4: Clone the Project from GitHub
Create the app directory in `/var/www` and clone the repository:
```bash
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/JubairAlamOvi02/choshmazone_server.git choshmazone
cd /var/www/choshmazone
```

---

## Step 5: Configure & Start the Backend Server

1. Navigate to the backend directory:
   ```bash
   cd /var/www/choshmazone/server
   ```
2. Install server dependencies:
   ```bash
   npm install --production
   ```
3. Create your production `.env` file:
   ```bash
   nano .env
   ```
   Paste the following configuration:
   ```env
   PORT=5000
   NODE_ENV=production
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=choshmazone
   DB_USER=choshma_user
   DB_PASSWORD=ChooseAStrongPassword123!
   JWT_SECRET=choshmazone_super_secret_jwt_key_change_this_to_random_string
   JWT_EXPIRES_IN=7d
   BASE_URL=https://choshmazone.com

   # Telegram Bot Instant Order Alerts (Optional companion notifications)
   TELEGRAM_BOT_TOKEN=8639759587:AAHgCaAwJfu35H2CYTFRhgpRDNYYwt9s8LQ
   TELEGRAM_CHAT_ID=2119791189

   # Google Sheets Order Sync Webhook
   GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxEmGDmu1IRiz9MqKBAnIH_SDfG9GJTIHfbRIipKw5Lb_vC_B9KorTUu6fbpP11ZmNF/exec
   ```
   Save with `Ctrl+O`, Enter, then exit with `Ctrl+X`.

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```
   *(Creates tables: users, products, categories, orders, order_items with variant columns, reviews, site_settings, visitor_sessions, web_events, and creates default Admin: `admin@choshmazone.com` / `admin12345`)*

5. Start the backend with PM2:
   ```bash
   cd /var/www/choshmazone
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
   *(Execute the output command displayed by `pm2 startup` to enable auto-start on server reboots).*

---

## Step 6: Configure & Build the React Frontend (Client)

1. Navigate to the client directory:
   ```bash
   cd /var/www/choshmazone/client
   ```
2. Create client production `.env`:
   ```bash
   nano .env
   ```
   Paste:
   ```env
   # Leave VITE_API_URL empty when served behind Nginx reverse proxy on the same domain
   VITE_API_URL=

   # Real-time Phone Push Notifications via ntfy (Zero-cost iOS & Android lockscreen alerts)
   VITE_NTFY_TOPIC=choshmazone-orders-secret-topic-change-me

   # Telegram Bot Notifications
   VITE_TELEGRAM_BOT_TOKEN=8639759587:AAHgCaAwJfu35H2CYTFRhgpRDNYYwt9s8LQ
   VITE_TELEGRAM_CHAT_ID=2119791189

   # Public Admin Orders URL (used for action buttons in notifications)
   VITE_ADMIN_BASE_URL=https://choshmazone.com/admin/orders
   ```
   Save with `Ctrl+O`, Enter, then exit with `Ctrl+X`.

3. Install frontend dependencies:
   ```bash
   npm install
   ```
4. Build the optimized production bundle:
   ```bash
   npm run build
   ```
   This compiles everything into `/var/www/choshmazone/client/dist`.

5. Set proper web ownership:
   ```bash
   sudo chown -R www-data:www-data /var/www/choshmazone
   sudo chmod -R 755 /var/www/choshmazone
   ```

---

## Step 7: Configure Nginx Web Server

1. Copy the provided Nginx configuration template:
   ```bash
   sudo cp /var/www/choshmazone/nginx.conf.example /etc/nginx/sites-available/choshmazone
   ```
2. Edit the configuration to replace `yourdomain.com` with your actual domain name:
   ```bash
   sudo nano /etc/nginx/sites-available/choshmazone
   ```
   > [!NOTE]
   > The configuration already includes `client_max_body_size 100M;` to support MP4/WebM video uploads for the **ChoshmaZone Spotlight Media Manager** and byte-range streaming for video playback.

3. Enable the site and test configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/choshmazone /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Step 8: Install Free SSL with Let's Encrypt (Certbot)

Obtain and configure the SSL certificate:
```bash
sudo certbot --nginx -d choshmazone.com -d www.choshmazone.com
```
Follow the interactive prompt (enter your email, agree to terms). Certbot will automatically configure HTTPS redirect and auto-renewal in Nginx!

---

## 📲 Step 9: Setup Free Phone Push Notifications (ntfy.sh)

1. Download the free **ntfy** app on your phone:
   - **Android:** [Google Play Store](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
   - **iPhone:** [Apple App Store](https://apps.apple.com/app/ntfy/id1625396347)
2. Open the app, tap **"+" (Add topic)**, and enter the topic name configured in your `client/.env` (`VITE_NTFY_TOPIC`).
3. Login to your store's admin panel at `https://choshmazone.com/admin/orders`, click **"Test Phone Notification"**, and verify you receive an instant audio alert with caller buttons on your lockscreen!

---

## 🔄 Step 10: Deploying Future Updates

Whenever you make changes and push them to GitHub:
```bash
ssh root@YOUR_VPS_IP
cd /var/www/choshmazone
git pull origin main

# Re-run migrations if database schema changed
cd server && npm install --production && npm run db:migrate
pm2 reload choshmazone-backend

# Rebuild frontend client
cd ../client && npm install && npm run build

echo "Deployment complete!"
```

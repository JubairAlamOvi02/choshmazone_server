# 🚀 Choshmazone Deployment Guide for Hostinger KVM 1 VPS

This complete guide will walk you through setting up and running your **Choshmazone** project (React Frontend + Node.js/Express Backend + PostgreSQL) on a fresh **Hostinger KVM 1** Ubuntu VPS (Ubuntu 22.04 or 24.04 LTS).

---

## 📋 System Requirements
- **Server:** Hostinger KVM 1 (1 vCPU, 4 GB RAM, 50 GB NVMe Storage)
- **OS:** Ubuntu 22.04 / 24.04 64-bit
- **Domain:** Your custom domain (e.g. `choshmazone.com`) pointing to your VPS IP address

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

## Step 2: Install Node.js, Git, Nginx, and Build Tools
Install Node.js 20.x LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx build-essential
```
Install PM2 globally to keep the server running continuously:
```bash
sudo npm install -g pm2
```
Verify installations:
```bash
node -v    # v20.x.x
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

## Step 4: Upload / Clone the Project to the Server
Create the app directory in `/var/www`:
```bash
sudo mkdir -p /var/www/choshmazone
sudo chown -R www-data:www-data /var/www/choshmazone
sudo chmod -R 755 /var/www/choshmazone
```

Upload your `choshmazone_server` folder to `/var/www/choshmazone` using Git, SCP, or SFTP (FileZilla):
```bash
# Example via SCP from your local machine:
scp -r d:/AG_Projects/choshmazone_server/* root@YOUR_VPS_IP:/var/www/choshmazone/
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
   cp .env.example .env
   nano .env
   ```
   Configure the values:
   ```env
   PORT=5000
   NODE_ENV=production
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=choshmazone
   DB_USER=choshma_user
   DB_PASSWORD=ChooseAStrongPassword123!
   JWT_SECRET=use_a_long_random_secret_string_here
   BASE_URL=https://yourdomain.com
   ```
   Save with `Ctrl+O`, Enter, then exit with `Ctrl+X`.

4. Run the database migration script to automatically create all tables and initial admin:
   ```bash
   npm run db:migrate
   ```
   *(This creates tables: users, products, categories, orders, order_items, reviews, site_settings, visitor_sessions, web_events, and default admin)*

5. Start the backend with PM2:
   ```bash
   cd /var/www/choshmazone
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
   *(Execute the output command displayed by `pm2 startup` to enable auto-start on server reboots).*

---

## Step 6: Build the Frontend (Client)

1. Navigate to the client directory:
   ```bash
   cd /var/www/choshmazone/client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the production bundle:
   ```bash
   npm run build
   ```
   This generates the optimized static files in `/var/www/choshmazone/client/dist`.

---

## Step 7: Configure Nginx Web Server

1. Copy the provided Nginx configuration:
   ```bash
   sudo cp /var/www/choshmazone/nginx.conf.example /etc/nginx/sites-available/choshmazone
   ```
2. Edit the configuration to replace `yourdomain.com` with your actual domain:
   ```bash
   sudo nano /etc/nginx/sites-available/choshmazone
   ```
3. Enable the site and test configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/choshmazone /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Step 8: Install Free SSL with Let's Encrypt (Certbot)

Install Certbot for Nginx:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and configure the SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Follow the interactive prompt (enter your email, agree to terms). Certbot will automatically configure HTTPS and auto-renewal in Nginx!

---

## 🔑 Default Administrator Credentials
After running `npm run db:migrate`, your initial administrator account is:
- **Email:** `admin@choshmazone.com`
- **Password:** `admin123456`

> **Note:** Log in immediately to your Admin Dashboard at `/admin` and change your password!

---

## 🛠️ Helpful Server Commands
- **Check Backend Status:** `pm2 status`
- **View Live Backend Logs:** `pm2 logs choshmazone-backend`
- **Restart Backend:** `pm2 restart choshmazone-backend`
- **Restart Nginx:** `sudo systemctl restart nginx`
- **Test Nginx Config:** `sudo nginx -t`
- **Database Shell:** `sudo -u postgres psql -d choshmazone`

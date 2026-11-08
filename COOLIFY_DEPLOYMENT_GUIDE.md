# 🚀 ChoshmaZone — Coolify Deployment & Domain Guide (Hostinger KVM 1 VPS)

This guide walks you step-by-step through connecting your Hostinger domain **`choshmazone.tech`** to your **Hostinger KVM 1 VPS** and deploying the fullstack **ChoshmaZone** store using **Coolify**.

---

## 📋 What You Need Before Starting
* **Domain:** `choshmazone.tech` (Purchased on Hostinger)
* **VPS:** Hostinger KVM 1 (Ubuntu 22.04 or 24.04 64-bit)
* **VPS IP Address:** `YOUR_VPS_IP` *(Find this in Hostinger hPanel $\rightarrow$ VPS $\rightarrow$ Overview, e.g. `194.164.55.123`)*
* **GitHub Repository:** `https://github.com/JubairAlamOvi02/choshmazone_server.git`

---

## 🌐 STEP 1: Point Your Hostinger Domain (`choshmazone.tech`) to Your VPS

Because both your domain and VPS are in Hostinger, connecting them takes less than 1 minute in your Hostinger hPanel:

### 1.1 Copy your VPS IP Address
1. Go to [Hostinger hPanel](https://hpanel.hostinger.com/).
2. Click **VPS** in the top navigation bar.
3. Click on your VPS server.
4. On the **Overview** page, look for **IP Address** and copy it (e.g. `194.164.55.123`).

### 1.2 Update DNS Records for `choshmazone.tech`
1. In Hostinger hPanel, click **Domains** in the top navigation bar.
2. Click **Manage** next to `choshmazone.tech`.
3. In the left sidebar, click **DNS / Nameservers** (or **DNS Records**).
4. Look at the existing DNS records list:
   * **Find the record with Type `A` and Name `@`**:
     * Click **Edit**.
     * Change **Points to** to: `YOUR_VPS_IP` *(e.g. `194.164.55.123`)*.
     * Set **TTL** to: `300` (5 minutes for fast update).
     * Click **Save** / **Update**.
   * **Find the record with Name `www`**:
     * If it is a `CNAME` pointing to `@` $\rightarrow$ Leave it as is (it already forwards to `@`).
     * If it is an `A` record $\rightarrow$ Edit **Points to** to: `YOUR_VPS_IP`.
     * Set **TTL** to: `300`.
     * Click **Save** / **Update**.
5. *(Optional verification)* Open PowerShell on your computer and test:
   ```powershell
   ping choshmazone.tech
   ```
   If it replies with your VPS IP, DNS has propagated!

---

## ⚡ STEP 2: Install Coolify on Your VPS

You can install Coolify in **either of two easy ways**:

### Option A: Via Hostinger 1-Click OS (Easiest & Cleanest)
1. In Hostinger hPanel, go to **VPS** $\rightarrow$ select your VPS $\rightarrow$ **Operating System**.
2. Click **Applications** tab $\rightarrow$ select **Ubuntu 22.04 with Coolify**.
3. Click **Install**. Hostinger installs Ubuntu, Docker, and Coolify automatically in ~2–3 minutes.

### Option B: Via Terminal (If you already have standard Ubuntu running)
1. Open PowerShell on your computer and SSH into your VPS:
   ```bash
   ssh root@YOUR_VPS_IP
   ```
2. Paste this single command and press **Enter**:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
   *(Wait ~3–5 minutes while it installs Docker and Coolify).*

> [!TIP]
> **Essential 2GB Swap Memory (for 1 vCPU):**
> Run this command in your VPS terminal to ensure building React 19 never runs out of memory:
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

---

## ⚡ STEP 3: Open Your Coolify Web Dashboard

1. Open your browser and visit:
   ```
   http://YOUR_VPS_IP:8000
   ```
   *(Replace with your VPS IP, e.g. `http://194.164.55.123:8000`)*

2. **Register your Master Account:**
   * Enter your name, email, and a secure password.
   * Click **Register**.

3. In the setup prompt, choose **localhost** as the default server.

---

## ⚡ STEP 4: Deploy ChoshmaZone via Docker Compose

1. In the Coolify dashboard, click **Projects** $\rightarrow$ select your project (e.g. `Default`) $\rightarrow$ click **+ New** (Add Resource).
2. Choose **Docker Compose** $\rightarrow$ select **Git Based**.
3. Fill in your repository details:
   * **Repository URL:** `https://github.com/JubairAlamOvi02/choshmazone_server.git`
   * **Branch:** `main`
   * **Compose File Path:** `docker-compose.yml`
4. Click **Continue**.

---

## ⚡ STEP 5: Attach Your Domain (`choshmazone.tech`) & Environment Variables

### 5.1 Set the Domain in Coolify
1. In your application settings, locate the **Domains** field.
2. Enter:
   ```
   https://choshmazone.tech,https://www.choshmazone.tech
   ```
   *(Coolify's built-in Traefik proxy will automatically request free Let's Encrypt SSL certificates for both domains with auto-renewal).*

### 5.2 Set Environment Variables
In the **Environment Variables** tab, enter or review the following:
```env
DB_PASSWORD=ChooseAStrongPassword123!
JWT_SECRET=choshmazone_super_secret_jwt_key_987654321
BASE_URL=https://choshmazone.tech

# Telegram Bot Instant Order Alerts (Optional)
TELEGRAM_BOT_TOKEN=8639759587:AAHgCaAwJfu35H2CYTFRhgpRDNYYwt9s8LQ
TELEGRAM_CHAT_ID=2119791189

# Google Sheets Sync Webhook (Optional)
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxEmGDmu1IRiz9MqKBAnIH_SDfG9GJTIHfbRIipKw5Lb_vC_B9KorTUu6fbpP11ZmNF/exec
```

---

## 🚀 STEP 6: Deploy!

1. Click the blue **Deploy** button in the top right corner.
2. Coolify will:
   * Clone the GitHub repository.
   * Start the PostgreSQL database container (and automatically run `server/schema.sql` to initialize all tables and seed the admin user).
   * Build the React frontend (`npm run build`) and serve via Nginx.
   * Start the Node.js/Express backend API on port 5000.
   * Generate free SSL certificates for `https://choshmazone.tech`.
3. Within 2–3 minutes, the status indicator will turn **Healthy (Green)**!

---

## 🔑 Your Live Website & Admin Credentials

* **Public Storefront:** `https://choshmazone.tech`
* **Admin Portal:** `https://choshmazone.tech/admin/login`
  * **Admin Email:** `admin@choshmazone.com`
  * **Password:** `admin123456`

---

## 🔄 How Future Updates Work
Whenever you make updates on your computer and push to GitHub:
```bash
git add .
git commit -m "Update store features"
git push origin main
```
Coolify detects the push automatically, pulls the new code, rebuilds the containers, and deploys your updates with **zero downtime**!

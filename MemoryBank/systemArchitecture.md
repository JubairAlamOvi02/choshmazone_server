# 🏗️ ChoshmaZone — System Architecture

## 🌐 High-Level Architecture Diagram

```
                 [ Internet Users / Mobile Browsers ]
                                 │
                                 ▼
                     ┌──────────────────────┐
                     │   Nginx (Port 80/443)│  (SSL via Let's Encrypt)
                     └──────────┬───────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼ (Static Files & SPA)                          ▼ (/api & /uploads)
┌──────────────────────────┐                ┌───────────────────────────┐
│  /var/www/choshmazone/   │                │ Express Backend (Port 5000│
│  client/dist/ (React SPA)│                │ Managed via PM2           │
└──────────────────────────┘                └─────────────┬─────────────┘
                                                          │
                                     ┌────────────────────┼────────────────────┐
                                     ▼                    ▼                    ▼
                           ┌──────────────────┐ ┌───────────────────┐ ┌─────────────────┐
                           │ PostgreSQL DB    │ │ Telegram Bot API  │ │ Google Sheets   │
                           │ (Port 5432)      │ │ (Order Alerts)    │ │ (Order Sync)    │
                           └──────────────────┘ └───────────────────┘ └─────────────────┘
```

---

## 🖥️ 1. Frontend Architecture (`/client`)

- **Framework**: Vite + React 19 SPA.
- **Routing**: `react-router-dom` v7 with code-splitting via `React.lazy` and `Suspense`.
- **Styling**: Tailwind CSS v4 with modern CSS variables, responsive typography, and glassmorphic micro-interactions.
- **State Management & Contexts**:
  - `AuthContext`: Manages user login state, JWT persistence in `localStorage`, and admin privileges.
  - `CartContext`: Local storage synced shopping cart with dynamic price calculations and style selections.
  - `WishlistContext`: Handles user wishlist syncing with the backend API.
  - `RecentlyViewedContext`: Tracks customer viewing history locally for high-converting social proof.
  - `ToastContext`: System-wide toast notification alerts.
- **API Client Layer (`client/src/lib/apiClient.js`)**:
  - Replaces Supabase SDK with pure `fetch` calls.
  - Automatically attaches `Authorization: Bearer <token>` when authenticated.
  - Automatically prepends `/api` endpoint routing (proxied during local development via `vite.config.js`).

---

## ⚙️ 2. Backend Architecture (`/server`)

- **Runtime**: Node.js v20+ with ECMAScript Modules (`"type": "module"`).
- **Web Framework**: Express.js with JSON body parser limit (15MB) for base64 image support.
- **Authentication**: JWT (`jsonwebtoken`) + `bcryptjs` password hashing.
  - `verifyToken`: Validates Bearer token in headers.
  - `requireAdmin`: Enforces `role === 'admin'`.
  - `optionalAuth`: Allows both guest checkout and logged-in user checkout.
- **Image Uploads**: `multer` middleware storing image files in `server/uploads/` directory, directly served statically at `/uploads`.
- **API Endpoints**:
  - `/api/auth`: Customer registration, login, profile management.
  - `/api/products`: Full CRUD, search filtering, category filtering, variant parsing.
  - `/api/categories`: Category management and active status toggling.
  - `/api/orders`: Order creation, guest checkout, tracking by Phone/ID, status workflows.
  - `/api/settings`: Key-value site settings and assets configuration.
  - `/api/reviews`: Product reviews and ratings.
  - `/api/analytics`: Visitor sessions, web events, funnel dropoff tracking.
  - `/api/admin`: Dashboard metrics, sales charts, customer management.
  - `/api/catalog.xml`: Dynamic XML product feed compatible with Facebook & Google Merchant Center.

---

## 🗄️ 3. Database Schema (`server/schema.sql`)

PostgreSQL relational database featuring full referential integrity:

| Table Name | Description | Key Fields |
| :--- | :--- | :--- |
| `users` | Customers & Admins | `id` (UUID), `email`, `password_hash`, `role`, `full_name` |
| `products` | Eyewear catalog | `id`, `name`, `price`, `stock_quantity`, `images` (JSONB), `variants` (JSONB) |
| `categories` | Product collections | `id`, `name`, `slug`, `image_url`, `is_active` |
| `orders` | Customer purchases | `id` (UUID), `user_id`, `total_amount`, `shipping_address` (JSONB), `status` |
| `order_items` | Products in order | `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `style` |
| `reviews` | Customer feedback | `id`, `product_id`, `user_id`, `rating`, `comment` |
| `site_settings` | Dynamic CMS configs | `key` (VARCHAR PK), `value` (TEXT), `updated_at` |
| `visitor_sessions`| Web analytics | `id`, `visitor_id`, `user_id`, `device_type`, `has_purchased` |
| `web_events` | Granular clickstream | `id`, `session_id`, `event_type`, `path`, `metadata` (JSONB) |
| `wishlist` | User saved products| `id`, `user_id`, `product_id`, `created_at` |

---

## 🔔 4. External Integrations (Zero Cost)

1. **Telegram Instant Order Alerts**:
   - Dispatches instant markdown-formatted notifications upon every completed checkout.
   - Includes order ID, total BDT, customer name, phone, address, and purchased item list.
2. **Google Sheets Sync**:
   - Webhook post to a Google Apps Script endpoint to log every order in real-time into an Excel-style sheet for accounting and courier dispatch.

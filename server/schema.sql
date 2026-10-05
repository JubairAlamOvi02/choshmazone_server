-- ==============================================================================
-- Choshmazone Custom PostgreSQL Schema
-- Native Database Structure for Hostinger KVM 1 VPS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    style TEXT,
    brand TEXT,
    frame_material TEXT,
    lens_material TEXT,
    lens_technology TEXT,
    lens_color TEXT,
    frame_color TEXT,
    color TEXT,
    frame_width TEXT,
    lens_width TEXT,
    bridge_width TEXT,
    temple_length TEXT,
    face_shape TEXT,
    spec_frame TEXT,
    spec_lens TEXT,
    spec_hardware TEXT,
    spec_weight TEXT,
    shipping_info TEXT,
    variants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'cancelled', 'completed')),
    total_amount NUMERIC(10,2) NOT NULL,
    shipping_address JSONB NOT NULL,
    payment_method TEXT DEFAULT 'cod',
    payment_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    style TEXT DEFAULT 'Default',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT wishlist_unique_user_product UNIQUE (user_id, product_id)
);

-- 8. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. VISITOR SESSIONS TABLE (Conversion Funnel & Analytics)
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_page TEXT,
    last_page TEXT,
    referrer TEXT,
    device_type TEXT,
    browser TEXT,
    operating_system TEXT,
    ip_address TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    isp TEXT,
    page_views_count INTEGER NOT NULL DEFAULT 1,
    has_viewed_product BOOLEAN NOT NULL DEFAULT FALSE,
    has_added_to_cart BOOLEAN NOT NULL DEFAULT FALSE,
    has_initiated_checkout BOOLEAN NOT NULL DEFAULT FALSE,
    has_purchased BOOLEAN NOT NULL DEFAULT FALSE,
    total_purchased_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    order_id UUID,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. WEB EVENTS TABLE
CREATE TABLE IF NOT EXISTS web_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    path TEXT NOT NULL,
    page_title TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    device_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON visitor_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_events_session_id ON web_events(session_id);
CREATE INDEX IF NOT EXISTS idx_web_events_created_at ON web_events(created_at DESC);

-- DEFAULT SEED: Initial Admin Account (email: admin@choshmazone.com, password: admin123456)
-- Password hash generated with bcrypt 10 rounds for 'admin123456'
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@choshmazone.com',
    '/2gQ4F7u5W.89vG5e5qE4Y/kL0W8Ff2',
    'Admin User',
    'admin'
) ON CONFLICT (email) DO NOTHING;

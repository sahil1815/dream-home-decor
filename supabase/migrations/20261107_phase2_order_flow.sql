-- ==============================================================================
-- DREAM HOME DECOR - PHASE 2: DATABASE & ORDER FLOW MIGRATION
-- Migration Date: 2026-11-07
-- ==============================================================================

-- 1. Sequential Human-Friendly Order Number Generator (DHD-1001, DHD-1002, ...)
CREATE SEQUENCE IF NOT EXISTS dhd_order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_dhd_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'DHD-' || nextval('dhd_order_number_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_dhd_order_number();

-- 2. Expand orders table with Phase 2 fields if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 3. Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Trigger: Automatically record status changes in order_status_history
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_status_history (order_id, status, note, changed_by, created_at)
    VALUES (NEW.id, NEW.status, 'স্ট্যাটাস পরিবর্তন: ' || NEW.status, 'system', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- 4. Internal Order Notes Table (Staff Only)
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON order_notes(order_id);

-- 5. Customers Table & Auto-Upsert
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  delivery_zone TEXT,
  total_orders INTEGER NOT NULL DEFAULT 1,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Trigger: Upsert into customers on new order
CREATE OR REPLACE FUNCTION sync_customer_on_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customers (phone, name, address, delivery_zone, total_orders, total_spent, updated_at)
  VALUES (
    NEW.customer_phone,
    NEW.customer_name,
    NEW.customer_address,
    NEW.delivery_zone,
    1,
    NEW.total_amount,
    NOW()
  )
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    address = COALESCE(EXCLUDED.address, customers.address),
    delivery_zone = COALESCE(EXCLUDED.delivery_zone, customers.delivery_zone),
    total_orders = customers.total_orders + 1,
    total_spent = customers.total_spent + EXCLUDED.total_spent,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_customer_on_order ON orders;
CREATE TRIGGER trigger_sync_customer_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_on_order();

-- 6. Product Images Table (Supports Drive Import & Local Placeholders)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  storage_key TEXT,
  alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  blur_data_url TEXT,
  source TEXT NOT NULL DEFAULT 'upload', -- 'placeholder' | 'drive' | 'upload'
  is_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(sort_order ASC);

-- 7. Product Variants (Color, Size, Material options)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_type TEXT NOT NULL DEFAULT 'color', -- 'color' | 'size'
  name TEXT NOT NULL,
  sku TEXT,
  price_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stock_quantity INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- 8. Delivery Zones Configuration
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- 'inside' | 'outside'
  charge NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  estimated_days TEXT NOT NULL DEFAULT '২-৩ দিন',
  free_threshold NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default delivery zones
INSERT INTO delivery_zones (name, name_bn, slug, charge, estimated_days)
VALUES
  ('Inside Dhaka Metro', 'ঢাকার ভেতরে (মেট্রো)', 'inside', 120.00, '২-৩ দিন'),
  ('Outside Dhaka', 'ঢাকার বাইরে (সারাদেশ)', 'outside', 200.00, '৩-৫ দিন')
ON CONFLICT (slug) DO NOTHING;

-- 9. Site Media Slots (Hero, Workshop Steps, Showroom, OG)
CREATE TABLE IF NOT EXISTS site_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  source TEXT NOT NULL DEFAULT 'upload',
  is_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Site Content Editor (Announcements, Policies, FAQs, About)
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY, -- 'faq', 'policy_delivery', 'policy_return', 'policy_privacy', 'about'
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Admin Users (Managed credentials for multi-tier roles)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'owner' | 'manager' | 'staff'
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Immutable Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- 13. Custom Furniture Order Requests Inbox
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  dimensions TEXT,
  color TEXT,
  budget NUMERIC(10, 2),
  description TEXT,
  reference_images TEXT[],
  status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'quoted' | 'accepted' | 'rejected'
  quoted_price NUMERIC(10, 2),
  staff_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_requests_created_at ON custom_requests(created_at DESC);

-- 14. Customer Reviews Moderation
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  customer_photos TEXT[],
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- 15. Discount Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Abandoned Checkouts Recovery
CREATE TABLE IF NOT EXISTS abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  cart_items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  is_recovered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_phone ON abandoned_checkouts(customer_phone);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
-- ==============================================================================
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Public can read active images, variants, delivery zones, site media, approved reviews
CREATE POLICY "Public read active product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read active variants" ON product_variants FOR SELECT USING (is_available = true);
CREATE POLICY "Public read delivery zones" ON delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Public read site media" ON site_media FOR SELECT USING (true);
CREATE POLICY "Public read site content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = true);

-- Public can submit custom requests and abandoned checkouts
CREATE POLICY "Public insert custom requests" ON custom_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert abandoned checkouts" ON abandoned_checkouts FOR INSERT WITH CHECK (true);

-- Authenticated Admin can manage all tables
CREATE POLICY "Admin manage status history" ON order_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage order notes" ON order_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage product images" ON product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage product variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage delivery zones" ON delivery_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage site media" ON site_media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage site content" ON site_content FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage admin users" ON admin_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage audit log" ON audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage custom requests" ON custom_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage reviews" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage coupons" ON coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage abandoned checkouts" ON abandoned_checkouts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- DREAM HOME DECOR - COMPLETE PRODUCTION DATABASE SETUP & SEED SCRIPT
-- Execute this script once in the Supabase Dashboard: SQL Editor -> Run
-- Project: https://pnipubiflitwjaaagnau.supabase.co
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SEQUENCES FOR ORDER NUMBERING (e.g. DHD-1001)
CREATE SEQUENCE IF NOT EXISTS dhd_order_number_seq START WITH 1004;

-- 3. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'Dream Home Decor',
  site_name_bn TEXT NOT NULL DEFAULT 'ড্রিম হোম ডেকোর',
  logo_url TEXT DEFAULT '/brand-images/official_brand_logo.jpg',
  cover_banner_url TEXT DEFAULT '/placeholders/site/hero.jpg',
  phone TEXT NOT NULL DEFAULT '01712-345678',
  whatsapp_number TEXT NOT NULL DEFAULT '8801712345678',
  facebook_url TEXT NOT NULL DEFAULT 'https://www.facebook.com/profile.php?id=61584955311887',
  address TEXT NOT NULL DEFAULT 'সেকশন ১০, ব্লক সি, রোড ২, মিরপুর, ঢাকা ১২১৬ (মিরপুর ১০ গোলচত্বর সংলগ্ন)',
  delivery_charge_inside NUMERIC NOT NULL DEFAULT 120,
  delivery_charge_outside NUMERIC NOT NULL DEFAULT 200,
  announcement_text TEXT NOT NULL DEFAULT 'নিজস্ব কারখানায় তৈরি সেরা মানের ফার্নিচার! সারাদেশে ক্যাশ অন ডেলিভারি।',
  bkash_merchant_number TEXT DEFAULT '01712345678',
  nagad_merchant_number TEXT DEFAULT '01712345678',
  show_placeholder_tag BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}'::TEXT[],
  dimensions TEXT,
  material TEXT DEFAULT 'উন্নত মেলামাইন বোর্ড (১৬ মিমি) ও ১ মিমি পিভিসি এজ ব্যান্ডিং',
  color_options TEXT[] DEFAULT ARRAY['Walnut Brown', 'Teak Wood', 'Classic White'],
  stock_status TEXT DEFAULT 'in_stock',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. DELIVERY ZONES TABLE
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  charge NUMERIC NOT NULL,
  estimated_days TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. ORDERS TABLE (Supports Full 9-Status Flow & Tracking)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  delivery_zone TEXT NOT NULL DEFAULT 'inside',
  delivery_charge NUMERIC NOT NULL DEFAULT 120,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cod',
  transaction_id TEXT,
  order_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_flagged_suspicious BOOLEAN DEFAULT false,
  due_amount NUMERIC DEFAULT 0,
  advance_payment_amount NUMERIC DEFAULT 0,
  courier_tracking_code TEXT,
  courier_consignment_id TEXT,
  courier_status TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  selected_color TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. ORDER INTERNAL NOTES TABLE
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. CUSTOMERS DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  address TEXT,
  delivery_zone TEXT DEFAULT 'inside',
  total_orders INT DEFAULT 1,
  total_spent NUMERIC DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. CUSTOM FURNITURE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  dimensions TEXT,
  color TEXT,
  budget NUMERIC,
  description TEXT,
  reference_image_url TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'quoted', 'accepted', 'rejected'
  quoted_price NUMERIC,
  staff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. ABANDONED CHECKOUTS TABLE
CREATE TABLE IF NOT EXISTS abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  items JSONB DEFAULT '[]'::JSONB,
  subtotal NUMERIC DEFAULT 0,
  is_recovered BOOLEAN DEFAULT false,
  recovered_order_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 16. SITE CONTENT & POLICIES TABLE
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 17. AUDIT LOG (IMMUTABLE)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 18. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 19. CAMPAIGNS & WORKSHOP SETTINGS
CREATE TABLE IF NOT EXISTS campaigns_giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  discount_code TEXT,
  discount_percentage INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS workshop_settings (
  id INT PRIMARY KEY DEFAULT 1,
  video_url TEXT,
  caption_title TEXT,
  caption_subtitle TEXT,
  story_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT single_workshop_row CHECK (id = 1)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies so server actions and admin can write reliably
-- ==============================================================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns_giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_settings ENABLE ROW LEVEL SECURITY;

-- Allow full access for all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public full access policy" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Public full access policy" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- ==============================================================================
-- INITIAL SEED DATA
-- Ensures all cards, orders, and customer records exist as real PostgreSQL rows
-- ==============================================================================

-- 1. Delivery Zones
INSERT INTO delivery_zones (name, name_bn, slug, charge, estimated_days, is_active)
VALUES 
  ('Inside Dhaka Metro', 'ঢাকার ভেতরে (মেট্রো)', 'inside', 120, '২-৩ দিন', true),
  ('Outside Dhaka', 'ঢাকার বাইরে (সারাদেশ)', 'outside', 200, '৩-৫ দিন', true)
ON CONFLICT (slug) DO UPDATE SET charge = EXCLUDED.charge, is_active = EXCLUDED.is_active;

-- 2. Initial Customers (Shown in Customer Directory)
INSERT INTO customers (id, name, phone, address, delivery_zone, total_orders, total_spent, is_blocked, notes)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'রফিকুল ইসলাম', '01711223344', 'রোড ১২, সেক্টর ৪, উত্তরা, ঢাকা', 'inside', 3, 12500, false, 'নিয়মিত কাস্টমার, ফিনিশিং ভালো পছন্দ করেন'),
  ('c0000000-0000-0000-0000-000000000002', 'ফারজানা ইসলাম', '01812345678', 'নুরজাহান রোড, মোহাম্মদপুর, ঢাকা', 'inside', 1, 4520, false, 'ফোন করার আগে WhatsApp-এ নক দিতে অনুরোধ করেছেন'),
  ('c0000000-0000-0000-0000-000000000003', 'সাকিব হাসান', '01998877665', 'জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম', 'outside', 1, 5400, false, 'চট্টগ্রাম কুরিয়ার ডেলিভারি')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, notes = EXCLUDED.notes;

-- 3. Initial Orders (Shown in Order Management & Production Kanban)
INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_address, delivery_zone, delivery_charge, subtotal, total_amount, payment_method, status, due_amount)
VALUES
  ('o0000000-0000-0000-0000-000000000001', 'DHD-1001', 'তানভীর আহমেদ', '01711223344', 'বাড়ি ১২, রোড ৪, সেক্টর ১০, উত্তরা, ঢাকা', 'inside', 120, 3800, 3920, 'cod', 'in_production', 3920),
  ('o0000000-0000-0000-0000-000000000002', 'DHD-1002', 'ফারজানা ইসলাম', '01812345678', 'নুরজাহান রোড, মোহাম্মদপুর, ঢাকা', 'inside', 120, 4400, 4520, 'cod', 'confirmed', 4520),
  ('o0000000-0000-0000-0000-000000000003', 'DHD-1003', 'সাকিব হাসান', '01998877665', 'জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম', 'outside', 200, 5200, 5400, 'cod', 'pending', 5400)
ON CONFLICT (order_number) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();

-- 4. Initial Order Items
INSERT INTO order_items (order_id, product_title, selected_color, quantity, unit_price)
VALUES
  ('o0000000-0000-0000-0000-000000000001', 'Smart Ergonomic Reading Table with Bookshelf', 'Walnut Brown', 1, 3800),
  ('o0000000-0000-0000-0000-000000000002', 'Modern Multi-Tier Open Bookshelf & Display Rack', 'Teak Wood', 1, 4400),
  ('o0000000-0000-0000-0000-000000000003', 'Executive Workstation & Computer Desk', 'Classic White', 1, 5200)
ON CONFLICT DO NOTHING;

-- 5. Initial Status History
INSERT INTO order_status_history (order_id, status, note, changed_by)
VALUES
  ('o0000000-0000-0000-0000-000000000001', 'in_production', 'কারখানায় বোর্ড কাটিং ও ফিটিং শুরু হয়েছে', 'সিস্টেম'),
  ('o0000000-0000-0000-0000-000000000002', 'confirmed', 'গ্রাহকের সাথে ফোনে কথা বলে অর্ডার নিশ্চিত করা হয়েছে', 'সিস্টেম'),
  ('o0000000-0000-0000-0000-000000000003', 'pending', 'ওয়েবসাইট থেকে নতুন অর্ডার প্লেস করা হয়েছে', 'গ্রাহক')
ON CONFLICT DO NOTHING;

-- 6. Initial Custom Furniture Request (Shown in Custom Orders Modal)
INSERT INTO custom_requests (id, customer_name, customer_phone, dimensions, color, budget, description, status, quoted_price, staff_notes)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'তানভীর আহমেদ', '01711223344', '5ft x 2.5ft x 3ft', 'Dark Walnut', 8500, 'অফিস ডেস্কে মনিটর আর্ম মাউন্ট এবং ড্রয়ারের ডাবল চ্যানেল ড্রপ চাই।', 'new', 8500, 'বোর্ড কোয়ালিটি, চ্যানেল ফিটিংস এবং লিড-টাইম নোট লিখুন...')
ON CONFLICT DO NOTHING;

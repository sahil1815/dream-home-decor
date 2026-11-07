-- ==============================================================================
-- DREAM HOME DECOR - SUPABASE POSTGRESQL DATABASE SCHEMA & SEED DATA
-- Direct-to-Consumer (D2C) Furniture & Workshop E-commerce Platform
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SEQUENCES FOR ORDER NUMBERING (e.g., DHD-1001)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

-- 3. SITE SETTINGS TABLE (Brand, Contact, Delivery & Announcements)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'Dream Home Decor',
  site_name_bn TEXT NOT NULL DEFAULT 'ড্রিম হোম ডেকোর',
  logo_url TEXT DEFAULT 'https://ik.imagekit.io/dreamhomedecor/brand/logo.png',
  cover_banner_url TEXT DEFAULT '/placeholders/site/hero.jpg',
  phone TEXT NOT NULL DEFAULT '01700-000000',
  whatsapp_number TEXT NOT NULL DEFAULT '8801700000000',
  facebook_url TEXT NOT NULL DEFAULT 'https://www.facebook.com/profile.php?id=61584955311887',
  address TEXT NOT NULL DEFAULT 'Mirpur, Dhaka, Bangladesh (সরাসরি নিজস্ব কারখানা)',
  delivery_charge_inside NUMERIC NOT NULL DEFAULT 120,
  delivery_charge_outside NUMERIC NOT NULL DEFAULT 200,
  announcement_text TEXT NOT NULL DEFAULT '🎉 নিজস্ব কারখানায় তৈরি সেরা মানের ফার্নিচার! সারাদেশে ক্যাশ অন ডেলিভারি। ২৪ ঘণ্টা অর্ডার সার্ভিস।',
  bkash_merchant_number TEXT DEFAULT '01700-000000',
  nagad_merchant_number TEXT DEFAULT '01700-000000',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}'::TEXT[],
  dimensions TEXT,
  material TEXT DEFAULT 'Melamine Board / Malaysian Wood Processed Board',
  color_options TEXT[] DEFAULT ARRAY['Walnut Brown', 'Teak Wood', 'Antique Pine', 'Classic White'],
  stock_status TEXT CHECK (stock_status IN ('in_stock', 'made_to_order', 'out_of_stock')) DEFAULT 'in_stock',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('DHD-' || nextval('order_number_seq')::TEXT),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  delivery_zone TEXT CHECK (delivery_zone IN ('inside', 'outside')) NOT NULL DEFAULT 'inside',
  delivery_charge NUMERIC NOT NULL DEFAULT 120,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cod', 'bkash_manual', 'nagad_manual')) DEFAULT 'cod',
  transaction_id TEXT,
  order_notes TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  selected_color TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CAMPAIGNS & GIVEAWAYS TABLE (Facebook Lottery / Flash Sales)
CREATE TABLE IF NOT EXISTS campaigns_giveaways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  facebook_post_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. WORKSHOP SETTINGS TABLE (Factory Tour, Steps & Live Video Banner)
CREATE TABLE IF NOT EXISTS workshop_settings (
  id INT PRIMARY KEY DEFAULT 1,
  badge TEXT NOT NULL DEFAULT 'সরাসরি কারখানার অন্দরমহল • Inside Our Workshop',
  title TEXT NOT NULL DEFAULT 'আমরা কীভাবে তৈরি করি আপনার পছন্দের ফার্নিচার?',
  description TEXT NOT NULL DEFAULT 'কোনো থার্ড-পার্টি বা মধ্যস্বত্বভোগী নয় — বোর্ড কেনা থেকে শুরু করে কাটিং, সাইজিং ও ডেলিভারি প্যাকেজিং পর্যন্ত সবকিছু সম্পন্ন হয় আমাদের নিজস্ব মিরপুরের ওয়ার্কশপে। তাই পাচ্ছেন সেরা ফিনিশিং ও অবিশ্বাস্য সাশ্রয়ী রেট।',
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  video_card JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_workshop_row CHECK (id = 1)
);

-- ==============================================================================
-- INDEXES FOR FAST QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns_giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_settings ENABLE ROW LEVEL SECURITY;

-- SITE SETTINGS POLICIES:
-- Public can read site settings
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Authenticated admin can update site settings
CREATE POLICY "Admin can update site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CATEGORIES POLICIES:
-- Public can view active categories
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Admin can manage all categories
CREATE POLICY "Admin can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PRODUCTS POLICIES:
-- Public can view active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Admin can manage all products
CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ORDERS POLICIES:
-- Public can insert new orders during checkout (no login required)
CREATE POLICY "Public can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- NOTE: Public SELECT on orders is REVOKED to protect customer PII (phone, address, orders).
-- Order tracking lookups are strictly routed through secure Server Actions using SUPABASE_SERVICE_ROLE_KEY
-- which require both (order_number, normalized_phone) and return masked PII.

-- Admin can view, update, delete all orders
CREATE POLICY "Admin can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ORDER ITEMS POLICIES:
-- Public can insert order items alongside their order
CREATE POLICY "Public can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- NOTE: Public SELECT on order items is REVOKED. Lookups are handled via secure Server Actions.

-- Admin can manage order items
CREATE POLICY "Admin can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CAMPAIGNS POLICIES:
-- Public can view campaigns (storefront queries filter by is_active)
CREATE POLICY "Public can view campaigns"
  ON campaigns_giveaways FOR SELECT
  USING (true);

-- Admin can manage all campaigns
CREATE POLICY "Admin can manage campaigns"
  ON campaigns_giveaways FOR ALL
  USING (true)
  WITH CHECK (true);

-- WORKSHOP SETTINGS POLICIES:
-- Public can view workshop settings
CREATE POLICY "Public can view workshop settings"
  ON workshop_settings FOR SELECT
  USING (true);

-- Admin can update workshop settings
CREATE POLICY "Admin can manage workshop settings"
  ON workshop_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- REALISTIC SEED DATA FOR DREAM HOME DECOR
-- ==============================================================================

-- Initial Site Settings
INSERT INTO site_settings (
  id,
  site_name,
  site_name_bn,
  logo_url,
  cover_banner_url,
  phone,
  whatsapp_number,
  facebook_url,
  address,
  delivery_charge_inside,
  delivery_charge_outside,
  announcement_text,
  bkash_merchant_number,
  nagad_merchant_number
) VALUES (
  1,
  'Dream Home Decor',
  'ড্রিম হোম ডেকোর',
  'https://ik.imagekit.io/dreamhomedecor/brand/logo.png',
  '/placeholders/site/hero.jpg',
  '01712-345678',
  '8801712345678',
  'https://www.facebook.com/profile.php?id=61584955311887',
  'মিরপুর-১০, ঢাকা, বাংলাদেশ (সরাসরি নিজস্ব কারখানা ও শোরুম)',
  120,
  200,
  '🎉 নিজস্ব কারখানায় তৈরি সেরা মানের ফার্নিচার! সারাদেশে ক্যাশ অন ডেলিভারি। ২৪ ঘণ্টা অর্ডার সার্ভিস।',
  '01712345678',
  '01712345678'
) ON CONFLICT (id) DO NOTHING;

-- Seed Categories
INSERT INTO categories (id, name, name_bn, slug, image_url, display_order, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Reading Tables', 'পড়ার টেবিল', 'reading-tables', '/placeholders/products/smart-ergonomic-reading-table/01.jpg', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 'Computer Tables', 'কম্পিউটার টেবিল', 'computer-tables', '/placeholders/products/executive-workstation-computer-desk/01.jpg', 2, true),
  ('a0000000-0000-0000-0000-000000000003', 'Bookshelves', 'বইয়ের তাক ও বুকশেলফ', 'bookshelves', '/placeholders/products/modern-multi-tier-bookshelf/01.jpg', 3, true),
  ('a0000000-0000-0000-0000-000000000004', 'Wall Shelves & Racks', 'ওয়াল র‍্যাক ও ডেকোর', 'wall-shelves', '/placeholders/products/floating-geometric-wall-shelf-set/01.jpg', 4, true),
  ('a0000000-0000-0000-0000-000000000005', 'Dressing Tables', 'ড্রেসিং টেবিল', 'dressing-tables', '/placeholders/products/luxurious-mirror-dressing-table/01.jpg', 5, true),
  ('a0000000-0000-0000-0000-000000000006', 'Custom Carpentry', 'কাস্টম অর্ডার', 'custom-furniture', '/placeholders/site/workshop_1.jpg', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Core Products
INSERT INTO products (
  id,
  title,
  title_bn,
  slug,
  description,
  price,
  discount_price,
  category_id,
  images,
  dimensions,
  material,
  color_options,
  stock_status,
  is_featured,
  is_active
) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Smart Ergonomic Reading Table with Bookshelf',
    'বুকশেলফ সহ আধুনিক পড়ার টেবিল',
    'smart-ergonomic-reading-table',
    'আমাদের নিজস্ব কারখানায় উন্নত মানের ওয়াটারপ্রুফ মেলামাইন বোর্ড দিয়ে অত্যন্ত যত্নসহকারে তৈরি। বই রাখার পর্যাপ্ত তাক, ড্রয়ার এবং মসৃণ ফিনিশিং যুক্ত। দীর্ঘস্থায়ী ও মজবুত। পড়ার টেবিল ছাড়াও ল্যাপটপ ব্যবহারের জন্য আদর্শ।',
    4500,
    3800,
    'a0000000-0000-0000-0000-000000000001',
    ARRAY[
      '/placeholders/products/smart-ergonomic-reading-table/01.jpg',
      '/placeholders/products/smart-ergonomic-reading-table/02.jpg'
    ],
    '3.5ft (L) x 2ft (W) x 4.5ft (H)',
    'Premium Melamine Board with 1mm PVC Edge Banding',
    ARRAY['Walnut Brown', 'Teak Wood', 'Antique Wood', 'Classic White'],
    'in_stock',
    true,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Compact Student Study Table with Storage Cabinet',
    'স্টুডেন্ট স্টাডি টেবিল (ক্যাবিনেট সহ)',
    'compact-student-study-table',
    'কম জায়গায় সহজে ফিট হওয়া সুন্দর ও মজবুত স্টাডি টেবিল। নিচে বই ও ফাইল রাখার জন্য লকযুক্ত ড্রয়ার রয়েছে। হাই-গ্রেড মেলামাইন বোর্ড দ্বারা নিজস্ব কারিগর দ্বারা নির্মিত।',
    3800,
    3200,
    'a0000000-0000-0000-0000-000000000001',
    ARRAY[
      '/placeholders/products/compact-student-study-table/01.jpg',
      '/placeholders/products/compact-student-study-table/02.jpg'
    ],
    '3ft (L) x 2ft (W) x 2.5ft (H)',
    'Melamine Board (16mm thickness) with edge protection',
    ARRAY['Walnut Brown', 'Light Oak', 'Wenge Black'],
    'in_stock',
    true,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Executive Workstation & Computer Desk',
    'এক্সিকিউটিভ কম্পিউটার ও ওয়ার্কস্টেশন ডেস্ক',
    'executive-workstation-computer-desk',
    'ফ্রিল্যান্সার ও অফিস কাজের জন্য পারফেক্ট ওয়ার্কস্টেশন টেবিল। মনিটর, সিপিইউ ও কী-বোর্ড রাখার সুবিধার পাশাপাশি ক্যাবল ম্যানেজমেন্ট হোল রয়েছে। সরাসরি কারখানা রেটে দেওয়া হচ্ছে।',
    6200,
    5200,
    'a0000000-0000-0000-0000-000000000002',
    ARRAY[
      '/placeholders/products/executive-workstation-computer-desk/01.jpg',
      '/placeholders/products/executive-workstation-computer-desk/02.jpg'
    ],
    '4ft (L) x 2.2ft (W) x 2.5ft (H)',
    'Malaysian Processed Wood & Heavy Duty Hardware',
    ARRAY['Walnut Brown', 'Charcoal Grey', 'Natural Teak'],
    'in_stock',
    true,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'Modern Multi-Tier Open Bookshelf & Display Rack',
    'মডার্ন মাল্টি-টায়ার বুকশেলফ ও ডিসপ্লে র‍্যাক',
    'modern-multi-tier-bookshelf',
    'বই, শোপিস ও ঘর সাজানোর জন্য আধুনিক ডিজাইনের ওপেন বুকশেলফ। প্রিমিয়াম কোটিং এবং ভারী ওজন বহন করার ক্ষমতা সম্পন্ন মজবুত ফ্রেম।',
    5200,
    4400,
    'a0000000-0000-0000-0000-000000000003',
    ARRAY[
      '/placeholders/products/modern-multi-tier-bookshelf/01.jpg',
      '/placeholders/products/modern-multi-tier-bookshelf/02.jpg'
    ],
    '3ft (L) x 1ft (D) x 5ft (H)',
    'High Density Melamine Board (Scratch resistant)',
    ARRAY['Walnut Brown', 'Pure White', 'Antique Pine'],
    'in_stock',
    true,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'Floating Geometric Wall Shelf Set (Pack of 3)',
    'ফ্লোটিং জিওমেট্রিক ওয়াল শেলফ সেট (৩ পিস)',
    'floating-geometric-wall-shelf-set',
    'ঘরের সৌন্দর্য দ্বিগুণ করতে ড্রয়িং রুম কিংবা বেডরুমের দেয়ালের জন্য চমৎকার ৩ পিসের ওয়াল শেলফ। ইনভিজিবল মাউন্টিং সিস্টেম সহ সহজে দেয়ালে লাগানো যায়।',
    1800,
    1350,
    'a0000000-0000-0000-0000-000000000004',
    ARRAY[
      '/placeholders/products/floating-geometric-wall-shelf-set/01.jpg',
      '/placeholders/products/floating-geometric-wall-shelf-set/02.jpg'
    ],
    'Large: 14"x14", Medium: 12"x12", Small: 10"x10"',
    'Water-Resistant Melamine Finish',
    ARRAY['Walnut Brown', 'Glossy White', 'Matte Black'],
    'in_stock',
    false,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'Contemporary Full-Length Mirror Dressing Table',
    'ফুল-লেন্থ মিরর ও ড্রয়ার সহ আধুনিক ড্রেসিং টেবিল',
    'contemporary-full-length-dressing-table',
    'সৌখিন ও আকর্ষণীয় ডিজাইনের ড্রেসিং টেবিল। সম্পূর্ণ দৈর্ঘ্য আয়না, প্রসাধন সামগ্রী রাখার জন্য একাধিক গোপন শেলফ ও স্টোরেজ ড্রয়ার রয়েছে।',
    7800,
    6500,
    'a0000000-0000-0000-0000-000000000005',
    ARRAY[
      '/placeholders/products/luxurious-mirror-dressing-table/01.jpg',
      '/placeholders/products/luxurious-mirror-dressing-table/02.jpg'
    ],
    '2.5ft (L) x 1.5ft (W) x 6ft (H)',
    'Melamine Board with 5mm Belgian Mirror Glass',
    ARRAY['Walnut Brown', 'Teak Wood', 'White & Gold'],
    'made_to_order',
    true,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed Sample Giveaway Campaign
INSERT INTO campaigns_giveaways (
  id,
  title,
  description,
  banner_url,
  end_date,
  is_active,
  facebook_post_link
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Facebook Mega Giveaway: ফ্রি রিডিং টেবিল লটারি অফার!',
  'আমাদের ফেসবুক পেজে লাইক, শেয়ার ও কমেন্ট করে জিতে নিন আকর্ষণীয় পড়ার টেবিল সম্পূর্ণ ফ্রিতে! বিস্তারিত জানতে ফেসবুক পোস্টটি দেখুন।',
  '/placeholders/site/hero.jpg',
  timezone('utc'::text, now()) + INTERVAL '15 days',
  true,
  'https://www.facebook.com/profile.php?id=61584955311887'
) ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- PHASE 2 EXTENSIONS: ORDER FLOW, AUDIT LOG, CUSTOMERS & STORE METADATA
-- ==============================================================================

-- Sequential Order Number Generator
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

-- Order Status History Table
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

-- Internal Order Notes Table (Staff Only)
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON order_notes(order_id);

-- Customers Table
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

-- Product Images Table (Supports Drive Import & Local Placeholders)
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
  source TEXT NOT NULL DEFAULT 'upload',
  is_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_type TEXT NOT NULL DEFAULT 'color',
  name TEXT NOT NULL,
  sku TEXT,
  price_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stock_quantity INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Delivery Zones Configuration
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  charge NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  estimated_days TEXT NOT NULL DEFAULT '২-৩ দিন',
  free_threshold NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site Media Slots
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

-- Site Content Editor
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable Audit Log
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

-- Custom Furniture Order Requests Inbox
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  dimensions TEXT,
  color TEXT,
  budget NUMERIC(10, 2),
  description TEXT,
  reference_images TEXT[],
  status TEXT NOT NULL DEFAULT 'new',
  quoted_price NUMERIC(10, 2),
  staff_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Reviews Table
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

-- Discount Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Abandoned Checkouts Table
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

-- Enable RLS
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

-- Public Select Policies
CREATE POLICY "Public read active product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read active variants" ON product_variants FOR SELECT USING (is_available = true);
CREATE POLICY "Public read delivery zones" ON delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Public read site media" ON site_media FOR SELECT USING (true);
CREATE POLICY "Public read site content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = true);

-- Public Insert Policies
CREATE POLICY "Public insert custom requests" ON custom_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert abandoned checkouts" ON abandoned_checkouts FOR INSERT WITH CHECK (true);

-- Admin All Policies
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

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
  cover_banner_url TEXT DEFAULT 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85',
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

-- Public can view their order status by order_number or phone lookup
CREATE POLICY "Public can lookup their order"
  ON orders FOR SELECT
  USING (true);

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

-- Public can view order items (for tracking receipt)
CREATE POLICY "Public can view order items"
  ON order_items FOR SELECT
  USING (true);

-- Admin can manage order items
CREATE POLICY "Admin can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CAMPAIGNS POLICIES:
-- Public can view active campaigns
CREATE POLICY "Public can view active campaigns"
  ON campaigns_giveaways FOR SELECT
  USING (is_active = true);

-- Admin can manage all campaigns
CREATE POLICY "Admin can manage campaigns"
  ON campaigns_giveaways FOR ALL
  TO authenticated
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
  TO authenticated
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
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85',
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
  ('a0000000-0000-0000-0000-000000000001', 'Reading Tables', 'পড়ার টেবিল', 'reading-tables', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 'Computer Tables', 'কম্পিউটার টেবিল', 'computer-tables', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', 2, true),
  ('a0000000-0000-0000-0000-000000000003', 'Bookshelves', 'বইয়ের তাক ও বুকশেলফ', 'bookshelves', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', 3, true),
  ('a0000000-0000-0000-0000-000000000004', 'Wall Shelves & Racks', 'ওয়াল র‍্যাক ও ডেকোর', 'wall-shelves', 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80', 4, true),
  ('a0000000-0000-0000-0000-000000000005', 'Dressing Tables', 'ড্রেসিং টেবিল', 'dressing-tables', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', 5, true),
  ('a0000000-0000-0000-0000-000000000006', 'Custom Carpentry', 'কাস্টম অর্ডার', 'custom-furniture', 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80', 6, true)
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
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
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
      'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'
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
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
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
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80'
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
      'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80'
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
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
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
  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80',
  timezone('utc'::text, now()) + INTERVAL '15 days',
  true,
  'https://www.facebook.com/profile.php?id=61584955311887'
) ON CONFLICT (id) DO NOTHING;

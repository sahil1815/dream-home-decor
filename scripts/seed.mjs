#!/usr/bin/env node

/**
 * Dream Home Decor - Database Seed Script
 * Imports initial categories, products, delivery zones, media slots, and site settings
 * into Supabase using clean local assets without data loss.
 *
 * Usage:
 *   node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Load environment variables from .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            const val = values.join('=').trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = val;
            }
          }
        }
      });
      console.log(`[SEED] Loaded environment variables from ${file}`);
      break;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder')) {
  console.log('[SEED] Supabase credentials not found or placeholder in environment.');
  console.log('[SEED] Skipping remote database seed. Local mock data is active.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`[SEED] Connecting to Supabase project: ${supabaseUrl}`);

const MOCK_CATEGORIES = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Reading Tables',
    name_bn: 'পড়ার টেবিল',
    slug: 'reading-tables',
    image_url: '/placeholders/products/smart-ergonomic-reading-table/01.jpg',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Computer Tables',
    name_bn: 'কম্পিউটার টেবিল',
    slug: 'computer-tables',
    image_url: '/placeholders/products/executive-workstation-computer-desk/01.jpg',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Bookshelves',
    name_bn: 'বইয়ের তাক ও বুকশেলফ',
    slug: 'bookshelves',
    image_url: '/placeholders/products/modern-multi-tier-bookshelf/01.jpg',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'Wall Shelves & Racks',
    name_bn: 'ওয়াল র‍্যাক ও ডেকোর',
    slug: 'wall-shelves',
    image_url: '/placeholders/products/floating-geometric-wall-shelf-set/01.jpg',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    name: 'Dressing Tables',
    name_bn: 'ড্রেসিং টেবিল',
    slug: 'dressing-tables',
    image_url: '/placeholders/products/luxurious-mirror-dressing-table/01.jpg',
    display_order: 5,
    is_active: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    name: 'Custom Carpentry',
    name_bn: 'কাস্টম অর্ডার',
    slug: 'custom-furniture',
    image_url: '/placeholders/site/workshop_1.jpg',
    display_order: 6,
    is_active: true,
  },
];

const MOCK_PRODUCTS = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Smart Ergonomic Reading Table with Bookshelf',
    title_bn: 'বুকশেলফ সহ আধুনিক পড়ার টেবিল',
    slug: 'smart-ergonomic-reading-table',
    description: 'আমাদের নিজস্ব কারখানায় উন্নত মানের ওয়াটারপ্রুফ মেলামাইন বোর্ড দিয়ে অত্যন্ত যত্নসহকারে তৈরি। বই রাখার পর্যাপ্ত তাক, ড্রয়ার এবং মসৃণ ফিনিশিং যুক্ত। দীর্ঘস্থায়ী ও মজবুত। পড়ার টেবিল ছাড়াও ল্যাপটপ ব্যবহারের জন্য আদর্শ। সরাসরি নিজস্ব কারখানা থেকে দেওয়া হচ্ছে আকর্ষণীয় সাশ্রয়ী মূল্যে।',
    price: 4500,
    discount_price: 3800,
    category_id: 'a0000000-0000-0000-0000-000000000001',
    images: [
      '/placeholders/products/smart-ergonomic-reading-table/01.jpg',
      '/placeholders/products/smart-ergonomic-reading-table/02.jpg',
    ],
    dimensions: '3.5ft (L) x 2ft (W) x 4.5ft (H)',
    material: 'Premium Melamine Board with 1mm PVC Edge Banding',
    color_options: ['Walnut Brown', 'Teak Wood', 'Antique Wood', 'Classic White'],
    stock_status: 'in_stock',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    title: 'Compact Student Study Table with Storage Cabinet',
    title_bn: 'স্টুডেন্ট স্টাডি টেবিল (ক্যাবিনেট সহ)',
    slug: 'compact-student-study-table',
    description: 'কম জায়গায় সহজে ফিট হওয়া সুন্দর ও মজবুত স্টাডি টেবিল। নিচে বই ও ফাইল রাখার জন্য লকযুক্ত ড্রয়ার রয়েছে। হাই-গ্রেড মেলামাইন বোর্ড দ্বারা নিজস্ব কারিগর দ্বারা নির্মিত।',
    price: 3800,
    discount_price: 3200,
    category_id: 'a0000000-0000-0000-0000-000000000001',
    images: [
      '/placeholders/products/compact-student-study-table/01.jpg',
      '/placeholders/products/compact-student-study-table/02.jpg',
    ],
    dimensions: '3ft (L) x 2ft (W) x 2.5ft (H)',
    material: 'Melamine Board (16mm thickness) with edge protection',
    color_options: ['Walnut Brown', 'Light Oak', 'Wenge Black'],
    stock_status: 'in_stock',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    title: 'Executive Workstation & Computer Desk',
    title_bn: 'এক্সিকিউটিভ কম্পিউটার ও ওয়ার্কস্টেশন ডেস্ক',
    slug: 'executive-workstation-computer-desk',
    description: 'ফ্রিল্যান্সার ও অফিস কাজের জন্য পারফেক্ট ওয়ার্কস্টেশন টেবিল। মনিটর, সিপিইউ ও কী-বোর্ড রাখার সুবিধার পাশাপাশি ক্যাবল ম্যানেজমেন্ট হোল রয়েছে। সরাসরি কারখানা রেটে দেওয়া হচ্ছে।',
    price: 6200,
    discount_price: 5200,
    category_id: 'a0000000-0000-0000-0000-000000000002',
    images: [
      '/placeholders/products/executive-workstation-computer-desk/01.jpg',
      '/placeholders/products/executive-workstation-computer-desk/02.jpg',
    ],
    dimensions: '4ft (L) x 2.2ft (W) x 2.5ft (H)',
    material: 'Malaysian Processed Wood & Heavy Duty Hardware',
    color_options: ['Walnut Brown', 'Charcoal Grey', 'Natural Teak'],
    stock_status: 'in_stock',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    title: 'Modern Multi-Tier Open Bookshelf & Display Rack',
    title_bn: 'মডার্ন মাল্টি-টায়ার বুকশেলফ ও ডিসপ্লে র‍্যাক',
    slug: 'modern-multi-tier-bookshelf',
    description: 'বই, শোপিস ও ঘর সাজানোর জন্য আধুনিক ডিজাইনের ওপেন বুকশেলফ। প্রিমিয়াম কোটিং এবং ভারী ওজন বহন করার ক্ষমতা সম্পন্ন মজবুত ফ্রেম। ড্রয়িং বা স্টাডি রুমের আকর্ষনীয় সংযোজন।',
    price: 5200,
    discount_price: 4400,
    category_id: 'a0000000-0000-0000-0000-000000000003',
    images: [
      '/placeholders/products/modern-multi-tier-bookshelf/01.jpg',
      '/placeholders/products/modern-multi-tier-bookshelf/02.jpg',
    ],
    dimensions: '3ft (L) x 1ft (D) x 5ft (H)',
    material: 'High Density Melamine Board (Scratch resistant)',
    color_options: ['Walnut Brown', 'Pure White', 'Antique Pine'],
    stock_status: 'in_stock',
    is_featured: true,
    is_active: true,
  },
];

async function runSeed() {
  try {
    // 1. Seed Site Settings
    console.log('[SEED] Upserting site settings...');
    await supabase.from('site_settings').upsert({
      id: 1,
      site_name: 'Dream Home Decor',
      site_name_bn: 'ড্রিম হোম ডেকোর',
      logo_url: '/brand-images/official_brand_logo.jpg',
      cover_banner_url: '/placeholders/site/hero.jpg',
      phone: '01712-345678',
      whatsapp_number: '8801712345678',
      facebook_url: 'https://www.facebook.com/profile.php?id=61584955311887',
      address: 'সেকশন ১০, ব্লক সি, রোড ২, মিরপুর, ঢাকা ১২১৬ (মিরপুর ১০ গোলচত্বর সংলগ্ন)',
      delivery_charge_inside: 120,
      delivery_charge_outside: 200,
      announcement_text: 'নিজস্ব কারখানায় তৈরি সেরা মানের ফার্নিচার! সারাদেশে ক্যাশ অন ডেলিভারি।',
      bkash_merchant_number: '01712345678',
      nagad_merchant_number: '01712345678',
      show_placeholder_tag: true,
      updated_at: new Date().toISOString(),
    });

    // 2. Seed Categories
    console.log('[SEED] Upserting categories...');
    for (const cat of MOCK_CATEGORIES) {
      await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    }

    // 3. Seed Products
    console.log('[SEED] Upserting products...');
    for (const prod of MOCK_PRODUCTS) {
      await supabase.from('products').upsert(prod, { onConflict: 'slug' });
    }

    // 4. Seed Delivery Zones
    console.log('[SEED] Upserting delivery zones...');
    await supabase.from('delivery_zones').upsert(
      [
        {
          name: 'Inside Dhaka Metro',
          name_bn: 'ঢাকার ভেতরে (মেট্রো)',
          slug: 'inside',
          charge: 120,
          estimated_days: '২-৩ দিন',
          is_active: true,
        },
        {
          name: 'Outside Dhaka',
          name_bn: 'ঢাকার বাইরে (সারাদেশ)',
          slug: 'outside',
          charge: 200,
          estimated_days: '৩-৫ দিন',
          is_active: true,
        },
      ],
      { onConflict: 'slug' }
    );

    console.log('[SEED] ✅ Database seed completed successfully!');
  } catch (err) {
    console.error('[SEED] ❌ Seed error:', err);
    process.exit(1);
  }
}

runSeed();

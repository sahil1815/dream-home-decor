# Dream Home Decor — Database Migration & Operations Plan

This guide outlines the production database architecture, migration sequence, seed procedure, and disaster recovery plan for **Dream Home Decor**.

---

## 1. Database Architecture & Tables

The database is built on **PostgreSQL (Supabase)** with Row-Level Security (RLS) enabled on every table.

| Table Name | Purpose | Access Control |
| :--- | :--- | :--- |
| `site_settings` | Factory branding, hotline, delivery charges (120/200), bKash | Public Read / Owner Update |
| `categories` | Product categories (Reading Tables, Bookshelves, Desk, etc.) | Public Read / Admin Manage |
| `products` | Core furniture items, dimensions, materials, and pricing | Public Read / Admin Manage |
| `product_images` | Gallery images (supports local placeholders & Google Drive sync) | Public Read / Admin Manage |
| `product_variants`| Variants by color (`Rustic Teak`, `Natural Wood`) and dimensions | Public Read / Admin Manage |
| `orders` | Customer orders, totals, zone, payment method, statuses | Service Role / Staff Manage (Public SELECT Revoked) |
| `order_items` | Products, quantities, and authoritative prices per order | Service Role / Staff Manage (Public SELECT Revoked) |
| `order_status_history`| Chronological audit trail for all order status progressions | Service Role / Staff Manage |
| `order_notes` | Private internal staff notes on customer orders | Admin Only |
| `customers` | Auto-synced customer directory, order history, blocklist | Admin Only |
| `delivery_zones` | Metro inside (৳120) and Outside Dhaka (৳200) configs | Public Read / Admin Manage |
| `site_media` | Media slots (`hero`, `workshop_1`..`4`, `showroom`, `og_default`) | Public Read / Admin Manage |
| `site_content` | Dynamic CMS text (Announcements, Return Policy, FAQs, About) | Public Read / Admin Manage |
| `admin_users` | Multi-tier staff credentials (`owner`, `manager`, `staff`) | Service Role Only |
| `audit_log` | Immutable record of who changed what and when | Admin Read / Service Role Insert |
| `custom_requests` | Custom furniture quotes & reference photo uploads | Public Insert / Admin Manage |
| `reviews` | Customer ratings, reviews, and verified photos | Public Read Approved / Admin Manage |
| `coupons` | Promo codes, discounts, usage limits, and expiries | Admin Manage |
| `abandoned_checkouts`| Unfinished checkout tracking & recovery hotline | Public Insert / Admin Manage |

---

## 2. Migration Execution Steps

### Option A: Via Supabase Dashboard (Recommended for Free Tier)
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard) and select the `dream_home_decor` project.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open [`supabase/schema.sql`](file:///Users/sahil/MyDocs/AG/dream_home_decor/supabase/schema.sql) and copy the entire contents.
4. Paste into the SQL Editor and click **Run**.
5. Once completed, execute [`supabase/migrations/20261107_phase2_order_flow.sql`](file:///Users/sahil/MyDocs/AG/dream_home_decor/supabase/migrations/20261107_phase2_order_flow.sql).

### Option B: Via Supabase CLI
```bash
# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## 3. Data Seeding

To seed the initial 4 factory products, categories, delivery zones, and site settings without data loss:

```bash
# Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local
npm run seed
```

The script will automatically upsert the catalog items by unique slug, ensuring existing product IDs remain intact.

---

## 4. Verification & Health Check

After applying migrations and setting up environment variables, run the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected output:
```json
{
  "status": "healthy",
  "service": "Dream Home Decor Storefront & API",
  "checks": {
    "database": "healthy",
    "auth_secret": true,
    "admin_owner_configured": true
  }
}
```

---

## 5. Rollback & Disaster Recovery

1. **Order Sequence**: `dhd_order_number_seq` ensures order numbers are sequential (`DHD-1001`, `DHD-1002`). In the event of a test order purge, the sequence can be reset with:
   ```sql
   ALTER SEQUENCE dhd_order_number_seq RESTART WITH 1001;
   ```
2. **Automated Offline Fallback**: If the database is ever disconnected or experiencing a regional Cloudflare outage, the application automatically falls back to read-only mock data within 3.5 seconds (`withTimeout`), guaranteeing the storefront never throws a 500 error.

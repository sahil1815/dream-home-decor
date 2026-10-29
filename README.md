# Dream Home Decor (ড্রিম হোম ডেকোর)
### D2C Furniture & Workshop E-Commerce Web Application

A full-stack, high-conversion e-commerce platform built for **Dream Home Decor** (Facebook: [facebook.com/profile.php?id=61584955311887](https://www.facebook.com/profile.php?id=61584955311887)). 

Built specifically for the Bangladeshi furniture market with direct factory pricing, board cutting workshop showcase, frictionless 3-field checkout (No login required), and an admin dashboard featuring ImageKit.io multi-URL preview management.

---

## 🌟 Key Highlights & USPs

1. **Direct Factory Pricing ("সরাসরি নিজস্ব কারখানায় তৈরি"):**
   - Highlights in-house board cutting and factory direct rates (e.g., Reading Tables from ৳3,800).
   - "Inside Our Workshop" section featuring board cutting machines, edge banding, and skilled carpentry.
2. **100% Free-Tier Architecture (Vercel + Supabase + ImageKit):**
   - **Zero Vercel Image Limits:** Uses ImageKit.io CDN URL transformations (`getOptimizedImageUrl`) and `unoptimized: true` on Next.js images to deliver auto-negotiated WebP/AVIF images without consuming Vercel Hobby tier image limits.
   - **Supabase Keep-Alive Cron:** Includes `/api/cron/keep-alive` and `vercel.json` cron (`0 0 */3 * *`) to prevent the 7-day Supabase free-tier inactivity pause.
   - **1-Hour ISR Caching:** Instant load times with on-demand `revalidatePath` when orders or products update.
3. **F-Commerce High-Conversion Storefront:**
   - Top announcement bar with phone hotline and WhatsApp CTA.
   - Visual category grid and filterable catalog.
   - Direct In-Page Fast Order Form on product pages + Add to Cart drawer + One-Click "Order via WhatsApp".
   - 3-field frictionless checkout with 11-digit Bangladeshi mobile validation (`01XXXXXXXXX`).
   - Order tracking page (`/track-order`) with a 5-step visual timeline (`Pending` → `Confirmed` → `In Production` → `Shipped` → `Delivered`).
   - Printable invoices with automatic confetti celebration.
4. **Mobile-Friendly Admin Dashboard (`/admin`):**
   - Protected by Supabase Auth (Email & Password).
   - Order management with 1-click status update (including "In Production / কারখানায় তৈরি হচ্ছে"), click-to-call, and click-to-WhatsApp.
   - Printable Courier Packing Slip formatted for courier handoff.
   - Dynamic ImageKit Multi-URL Preview Manager with real-time thumbnail checking, primary cover selection, and reordering.
   - Brand & Site Settings manager (Logo URL, Cover Banner, Hotlines, Delivery Charges).
   - Campaign & Giveaway manager linking to Facebook lottery posts.

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS, Lucide Icons, Canvas Confetti
- **Typography:** `Plus Jakarta Sans` (English) + `Hind Siliguri` (Bengali)
- **Database & Auth:** Supabase (PostgreSQL with RLS policies)
- **Image Hosting:** ImageKit.io direct URLs (`https://ik.imagekit.io/...`)
- **Hosting & Cron:** Vercel (Hobby Tier)

---

## 🚀 Quick Setup & Deployment Guide

### 1. Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repository, paste the entire SQL code, and click **Run**.
   - This creates all tables (`site_settings`, `categories`, `products`, `orders`, `order_items`, `campaigns_giveaways`), constraints, sequences, Row Level Security (RLS) policies, and realistic seed data for Dream Home Decor.

### 2. Environment Variables
Create `.env.local` based on [`.env.example`](./.env.example):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: secret token to verify /api/cron/keep-alive
CRON_SECRET=your-random-token
```

### 3. Running Locally
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit:
- Storefront: `http://localhost:3000`
- Products Catalog: `http://localhost:3000/products`
- Order Tracking: `http://localhost:3000/track-order`
- Admin Dashboard: `http://localhost:3000/admin` (Login: `admin@dreamhome.com` / `dreamhome123`)

### 4. Deploying to Vercel
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add the environment variables from `.env.local` to your Vercel Project Settings.
4. Deploy! The `vercel.json` cron will automatically schedule the keep-alive ping every 3 days.

---

## 📁 Project Architecture

```
├── app/
│   ├── layout.tsx              # Root layout with fonts, AnnouncementBar, Navbar, CartDrawer, QuickOrderModal
│   ├── page.tsx                # High-converting storefront homepage
│   ├── not-found.tsx           # Custom 404 page
│   ├── products/
│   │   ├── page.tsx            # Filterable product catalog with search & sorting
│   │   └── [slug]/page.tsx     # Product detail page with interactive gallery & in-page quick order
│   ├── checkout/
│   │   ├── page.tsx            # Frictionless 3-field checkout
│   │   └── success/page.tsx    # Order success page with confetti & printable invoice
│   ├── track-order/page.tsx    # Live order tracking stepper (Pending -> Delivered)
│   ├── admin/
│   │   ├── layout.tsx          # Admin sidebar layout & mobile drawer
│   │   ├── login/page.tsx      # Owner authentication
│   │   ├── page.tsx            # Admin overview & revenue metrics
│   │   ├── orders/page.tsx     # Order management & courier slip printing
│   │   ├── products/           # Product CRUD & ImageKit manager
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── settings/page.tsx   # Brand logo, cover banner, phone, delivery charges
│   │   └── campaigns/page.tsx  # Facebook giveaway & lottery campaign manager
│   └── api/cron/keep-alive/    # Supabase free-tier inactivity keep-alive ping
├── components/
│   ├── storefront/             # Storefront UI components
│   ├── admin/                  # Admin UI components (ImageKitUrlManager, etc.)
│   └── icons/                  # Custom SVG icons
├── context/
│   └── cart-context.tsx        # Shopping cart context with localStorage persistence
├── lib/
│   ├── imagekit.ts             # ImageKit URL transformation utility
│   ├── data.ts                 # Storefront & Admin data querying with mock fallback
│   ├── actions.ts              # Server actions (submit order, status update, save product)
│   ├── utils.ts                # Currency format (৳ BDT), phone validator, WhatsApp builder
│   └── supabase/               # Supabase browser, server & admin clients
├── supabase/
│   └── schema.sql              # Supabase tables, indexes, RLS & seed data
├── vercel.json                 # Vercel Hobby cron configuration
└── next.config.mjs             # Next.js ImageKit configuration
```

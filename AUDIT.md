# Comprehensive Technical, Security, and UX Audit: Dream Home Decor
**Target App:** https://dream-home-decor.vercel.app/  
**Framework:** Next.js 16.4.3 (Turbopack, App Router) • React 19.3.0 • Tailwind CSS v4 • Supabase  
**Audit Date:** November 2026  
**Auditors:** Senior Full-Stack Security Engineer & Senior Brand/UI Systems Designer  

---

## 1. Executive Summary

Dream Home Decor is a Direct-to-Consumer (D2C) wooden furniture manufacturer operating from Mirpur-10, Dhaka, targeting mobile-first, Bangla-speaking shoppers arriving from Facebook ads and WhatsApp.

While the application features a functional base (catalog display, shopping cart, cash-on-delivery checkout, order tracking, and an admin interface), this audit revealed **critical security vulnerabilities (P0)**, **serious customer privacy leaks**, **unprotected backend actions**, and **severe layout/architectural flaws** that undermine business integrity and brand credibility.

### Key Urgent Findings
1. **Critical Authentication Bypass & Public Credentials**: The admin login page publicly displays demo credentials and a "ডেমো মোডে প্রবেশ করুন" button that sets an unauthenticated client cookie (`dhd_demo_admin=true`), allowing anyone on the internet to bypass middleware and gain full admin access.
2. **Public Admin Links**: `/admin` is prominently linked from the public desktop Navbar, mobile hamburger drawer, and storefront Footer.
3. **Severe Customer PII Leak in Order Tracking**: The order tracking endpoint accepts any raw phone number with a wildcard query (`customer_phone.ilike.%query%`), exposing customer full names, unmasked mobile numbers, and full home addresses.
4. **Unprotected Server Actions & Client-Dictated Pricing**: None of the admin server actions (`saveProductAction`, `deleteProductAction`, `updateOrderStatusAction`, `saveSiteSettingsAction`, `saveCampaignAction`) verify authentication. Furthermore, checkout accepts client-calculated prices and delivery charges without server-side database validation.
5. **Architectural Shell Collision**: Storefront `Navbar`, `AnnouncementBar`, and `Footer` in `app/layout.tsx` wrap all `/admin` routes, creating a nested layout disaster on mobile phones (double headers, double hamburger menus, and storefront footers inside the admin).
6. **Vercel Read-Only Filesystem Conflicts**: Several server actions attempt to persist data using Node.js `fs.writeFile` to `data/workshop.json` and `data/campaigns.json`, which fails or is wiped out on Vercel serverless lambdas.
7. **AI-Template Aesthetics & Inconsistent Numeral Systems**: Heavy repetition of generic marketing superlatives, hotlinked Unsplash stock photos with duplicated URL parameters, missing images, and jarring mixtures of English (`৳3,800`) and Bengali (`৳৩,৮০০`) numerals.

---

## 2. Architecture Audit

### 2.1 Framework & Core Dependencies
- **Next.js Version:** `16.4.3` (Turbopack enabled, using `@tailwindcss/postcss` and `@tailwindcss/turbopack`).
- **React Version:** `19.3.0` (React 19 Server Components and Server Actions).
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss";` in `app/globals.css`).
- **Icons & UI:** `lucide-react` (v1.64.0), `canvas-confetti` (v1.9.4), `clsx`, `tailwind-merge`.
- **Database & Auth SDK:** `@supabase/ssr` (v0.12.7) and `@supabase/supabase-js` (v2.118.0).
- **Linting & Code Health:** ESLint 9 (`eslint-config-next: 16.4.3`). Running `npm run lint` generates **76 warnings** (mostly unused imports, unused variables, and improper `window.location.href` navigation).

### 2.2 Layout & Routing Architecture
- **Root Layout (`app/layout.tsx`)**:
  - The root layout unconditionally mounts `<AnnouncementBar />`, `<Navbar />`, `<Footer />`, `<CartDrawer />`, `<QuickOrderModal />`, and `<BottomStickyBar />`.
  - **Critical Flaw**: There are no route groups (e.g. `(storefront)` vs `(admin)`). Consequently, the public announcement bar, storefront navbar, and storefront footer render on every administrative page (`/admin`, `/admin/orders`, `/admin/products`, `/admin/settings`, `/admin/workshop`, `/admin/login`).
  - Only `BottomStickyBar` checks `if (pathname?.startsWith('/admin')) return null;`. The rest of the storefront chrome remains visible across the admin dashboard.
- **Middleware Convention Deprecation**:
  - Next.js 16 warns during build: `The "middleware" file convention is deprecated. Please use "proxy" instead.` (Next.js codemod `middleware-to-proxy` is recommended).

### 2.3 Data Layer & Persistence Mechanism
- The application implements a hybrid data layer across three tiers:
  1. **Supabase PostgreSQL**: Configured via `@supabase/ssr` and `@supabase/supabase-js`.
  2. **Local Static JSON**: `data/workshop.json` and `data/campaigns.json`.
  3. **In-Memory Fallback Arrays**: `lib/mock-data.ts` (`MOCK_PRODUCTS`, `MOCK_CATEGORIES`, `MOCK_SITE_SETTINGS`, `MOCK_SAMPLE_ORDERS`).
- **Timeout Fallback Pattern (`lib/data.ts`)**:
  - Every data fetcher wraps database queries with a 3,500ms timeout (`withTimeout`). If Supabase fails or takes longer than 3.5s, it silently falls back to static mock data.
  - **Issue during build**: During static page generation (`npm run build`), requests to Supabase timed out after 10,000ms (`UND_ERR_CONNECT_TIMEOUT`), producing console fetch failure errors before falling back to mock data.
- **Read-Only Filesystem Bug on Vercel**:
  - In `lib/actions.ts`, `saveWorkshopDataAction` and `saveCampaignAction` attempt to write directly to `data/workshop.json` and `data/campaigns.json` using `fs/promises`. On Vercel's serverless environment, runtime local file writes are ephemeral or fail with `EROFS: read-only file system`. All persistent state must reside in PostgreSQL or cloud storage.

### 2.4 State Management & Cart/Wishlist
- `context/cart-context.tsx` and `context/wishlist-context.tsx` manage client state via React Context and persist to `localStorage` (`dream_home_decor_cart` and `dream_home_decor_wishlist`).
- To avoid hydration mismatches, they defer hydration using `queueMicrotask` in `useEffect`. While this prevents hydration errors, cart counts render as 0 on initial SSR, causing a visible counter pop-in on mobile devices.

---

## 3. Security & Data Integrity Audit (P0 Critical)

| Severity | Issue | Location | Impact |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Public credentials and 1-click bypass cookie | `app/admin/login/page.tsx`, `lib/supabase/middleware.ts` | Complete unauthorized admin takeover |
| **CRITICAL** | Public header & footer links to admin panel | `components/storefront/Navbar.tsx`, `components/storefront/Footer.tsx` | Invites public attacks & crawler discovery |
| **CRITICAL** | Unprotected Admin Server Actions | `lib/actions.ts` | Anyone can edit products, delete items, update orders |
| **CRITICAL** | Customer PII leak in order tracking | `lib/data.ts`, `app/track-order/page.tsx` | Phone, address, name exposed via wildcard query |
| **CRITICAL** | Public SELECT RLS policy on orders | `supabase/schema.sql` | Direct REST API access dumps entire customer database |
| **HIGH** | Client-dictated pricing & delivery charges | `lib/actions.ts`, `app/checkout/page.tsx` | Price tampering (products purchasable for ৳1) |
| **HIGH** | Random order collision risk | `lib/actions.ts` | Order ID collisions (`DHD-` + random 4-digit number) |
| **HIGH** | Missing rate limiting & spam prevention | `app/checkout/page.tsx`, `lib/actions.ts` | Order flooding, SMS/WhatsApp bot spam |
| **MEDIUM** | Incomplete HTTP security headers | `next.config.mjs` | Missing CSP, HSTS, Permissions-Policy |

### 3.1 Admin Authentication & Bypass Cookie
In `app/admin/login/page.tsx`:
- Lines 53-56: Button `fillDemoCredentials` auto-populates `admin@dreamhome.com / dreamhome123`.
- Lines 58-62: Button `handleDemoAccess` sets a browser cookie:
  ```javascript
  document.cookie = 'dhd_demo_admin=true; path=/; max-age=86400; SameSite=Lax';
  ```
- In `lib/supabase/middleware.ts` (lines 10-20):
  ```typescript
  const isDemoAdmin = request.cookies.get('dhd_demo_admin')?.value === 'true';
  if (isDemoAdmin) {
    if (path === '/admin/login') { ... }
    return supabaseResponse; // Bypasses auth completely for /admin/*
  }
  ```
- **Consequence**: Anyone clicking "ডেমো মোডে প্রবেশ করুন" or setting `dhd_demo_admin=true` in developer tools has full administrative read/write access.

### 3.2 Public Exposure of Admin Entry Points
- `components/storefront/Navbar.tsx` (line 273): `<Link href="/admin" aria-label="অ্যাডমিন লগইন">` rendered as user profile icon.
- `components/storefront/Navbar.tsx` (line 443): Mobile menu contains explicit text link: `অ্যাডমিন লগইন (মালিকের পোর্টাল)`.
- `components/storefront/Footer.tsx` (line 208): Bottom bar contains link: `<Link href="/admin">অ্যাডমিন পোর্টাল</Link>`.
- Admin pages lack `<meta name="robots" content="noindex, nofollow" />`, exposing them to Google search indexing.

### 3.3 Customer Data Privacy Leak in Order Tracking
In `lib/data.ts` (lines 279-314):
```typescript
export async function trackOrderQuery(query: string): Promise<Order[]> {
  const cleaned = query.trim();
  ...
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .or(`order_number.ilike.%${cleaned}%,customer_phone.ilike.%${cleaned}%`)
    .order('created_at', { ascending: false });
```
In `app/track-order/page.tsx` (lines 215-220):
```tsx
<p className="font-bold text-stone-900 text-sm mt-0.5">{order.customer_name}</p>
<p className="text-stone-600 mt-0.5 break-words">{order.customer_address}</p>
<p className="text-stone-500 font-sans mt-0.5">{order.customer_phone}</p>
```
- **Consequence**: Entering `017` or any customer phone number executes an SQL `ILIKE` wildcard search that returns all matching orders, rendering unmasked names, complete home addresses, mobile numbers, itemized purchases, and transaction IDs.

### 3.4 Unprotected Server Actions
In `lib/actions.ts`:
- `saveProductAction`: Modifies or inserts products. **Auth check: NONE**.
- `deleteProductAction`: Deletes products from database. **Auth check: NONE**.
- `updateOrderStatusAction`: Updates order statuses. **Auth check: NONE**.
- `saveSiteSettingsAction`: Overwrites site brand, logo, hotline, and bank numbers. **Auth check: NONE**.
- `saveCampaignAction`: Creates or publishes campaigns. **Auth check: NONE**.
- `saveWorkshopDataAction`: Modifies workshop steps and video banner. **Auth check: NONE**.
- Anyone who discovers or triggers these server action endpoints via POST requests can alter production database records without logging in.

### 3.5 Price Tampering & Delivery Calculation
In `lib/actions.ts` (`submitOrderAction`):
- `payload` accepts `subtotal`, `delivery_charge`, `total_amount`, and `unit_price` directly from the client.
- The server performs zero validation against the `products` table in PostgreSQL. A malicious user can alter JavaScript form variables to submit an order with `unit_price: 1` and `total_amount: 1`.

### 3.6 Supabase Row Level Security (RLS) Leak
In `supabase/schema.sql` (lines 189-193):
```sql
CREATE POLICY "Public can lookup their order"
  ON orders FOR SELECT
  USING (true);
```
- Because RLS policy on `orders` is `USING (true)`, any client possessing the public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) can query `https://<project>.supabase.co/rest/v1/orders?select=*` and extract every order record in the database.

---

## 4. Frontend & Design System Audit

### 4.1 Visual Brand Identity & "AI-Made" Look
- **Superlative Copy Overload**: Phrases like "সরাসরি নিজস্ব কারখানায় তৈরি", "১০০% গ্যারান্টিযুক্ত", "অবিশ্বাস্য সাশ্রয়ী রেট", and "সেরা মানের ফার্নিচার" are repeated in virtually every section (Hero, Trust Badges, Spotlight, Comparison, Footer, Floating Contact).
- **Template-Like Feature Cards**: The 4-icon badge row in `components/storefront/TrustBadges.tsx` uses generic rainbow backgrounds (`bg-amber-100`, `bg-emerald-100`, `bg-blue-100`, `bg-purple-100`).
- **Emoji Usage**: The announcement bar and mock seed data prominently use `🎉`.
- **Comparison Section**: `app/page.tsx` (lines 208-285) employs a heavy green-check vs red-cross grid that makes unverified claims against competitors ("ভেতরের বোর্ডের মান সরাসরি যাচাই করার সুযোগ নেই", "দ্বিগুণ চার্জ দাবি করা হয়").

### 4.2 Photography & Media Pipeline Flaws
- **Unsplash Stock Dependency**: 100% of images on the site are hotlinked from Unsplash.
- **Image Duplication**:
  - `photo-1518455027359-f3f8164ba6bd` is used for: Hero background, Reading Table 1 main image, Student Table thumbnail 2, Category 1 banner, and Campaign giveaway.
  - `photo-1527443224154-c4a3942d3acf` is used for: Executive Workstation main image AND Reading Table thumbnail 2.
  - In product detail galleries, clicking the second thumbnail displays a completely different piece of furniture.
- **Duplicated URL Parameter Bug**:
  In `lib/imagekit.ts` (lines 43-46):
  ```typescript
  if (url.includes('images.unsplash.com') && width) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}&auto=format`;
  }
  ```
  If `url` already has `?auto=format&fit=crop&w=1600&q=85`, it appends `&w=900...`, resulting in invalid duplicate query keys (`w=1600...&w=900`).
- **Unused Local Brand Assets**: High-resolution local brand assets (`public/brand-images/official_brand_logo.jpg`, `factory_furniture_workshop.jpg`, `reading_table_study_desk.jpg`, etc.) exist in the repository but are completely unused.

### 4.3 Typography & Numeral Inconsistencies
- **Numeral Clashes**:
  - Hero headline: `৳৩,৮০০` (Bengali digits).
  - Utility function `formatBDT` (`lib/utils.ts` line 29): `৳${Number(amount).toLocaleString('en-IN')}` outputs `৳3,800` (Latin digits).
  - Cards, tables, and cart render English digits; promotional text renders Bengali digits.
- **Price Discrepancy**:
  - Hero copy declares: "পড়ার টেবিল শুরু মাত্র ৳৩,৮০০ টাকা থেকে!"
  - The catalog lists `compact-student-study-table` (স্টুডেন্ট স্টাডি টেবিল) starting at **৳৩,২০০**.

### 4.4 Mobile Layout & Viewport Bugs (360px, 390px, 768px, 1280px)
- **360px & 390px Mobile Screens**:
  - **Nested Shell Collision in Admin**: Loading `/admin` or `/admin/orders` on mobile renders the storefront announcement bar, storefront navbar (with hamburger), admin mobile header (with second hamburger), admin content, and storefront footer.
  - **Table Overflow**: `AdminOrdersManager.tsx` embeds a `min-w-[780px]` table. On a 390px phone, the table requires awkward horizontal panning with no responsive card layout.
  - **Text Truncation**: Bangla headings in `components/storefront/HeroSlider.tsx` and `QuickOrderModal.tsx` wrap tightly or overflow on 360px screens (e.g. Galaxy S8).
- **768px Tablet Viewports**:
  - The category grid switches to 3 columns, causing an uneven 2-row layout (6 items).
- **1280px Desktop**:
  - Layout is stable but excessive whitespace exists in product detail direct checkout forms.

### 4.5 Accessibility (a11y) Violations
- **Low Contrast Elements**:
  - `text-stone-400` on white backgrounds (#FAF8F5) yields a contrast ratio of **2.4:1** (fails WCAG AA threshold of 4.5:1).
  - `text-amber-100` on lighter background badges fails AA.
- **Unlabeled Interactive Elements**:
  - Modal close button (`✕`) in `AdminOrdersManager.tsx` has no `aria-label`.
  - Reorder buttons (`ArrowUp`, `ArrowDown`) in `ImageKitUrlManager.tsx` lack `aria-label`.
  - Feedback dismissal buttons in `WorkshopManager.tsx` and `AdminCampaignManager.tsx` lack accessible names.
- **Focus Rings**:
  - `focus:outline-hidden` is used extensively without providing a visible `focus-visible:ring-2` replacement on links and icon buttons.
- **Image Alt Attributes**:
  - Image alt tags use raw English product titles (`alt={product.title}`) rather than descriptive Bangla text.

---

## 5. Performance Profile

### 5.1 Image Optimization Disabled
In `next.config.mjs` (line 15):
```javascript
images: {
  unoptimized: true,
  ...
}
```
- By disabling Next.js Image Optimization, images served from Unsplash or external sources are downloaded in full uncompressed formats without responsive `srcset` generation or WebP/AVIF auto-negotiation.
- The hero image loads ~400KB–1.2MB of uncompressed JPEG assets on mobile connections.

### 5.2 Build-Time Network Timeouts
During `npm run build`, page pre-rendering attempts to query Supabase from server components:
```
TypeError: fetch failed
  [cause]: Error [ConnectTimeoutError]: Connect Timeout Error (attempted addresses: 172.64.149.246:443, 104.18.38.10:443, timeout: 10000ms)
```
- SSG generation hangs for 10 seconds per worker before falling back to mock data. Build time currently exceeds 21 seconds for only 4 static routes.

### 5.3 Font Delivery & Cumulative Layout Shift (CLS)
- Google Fonts (`Plus_Jakarta_Sans` and `Hind_Siliguri`) are imported via `next/font/google` with `display: 'swap'`.
- Because Bengali glyphs in Hind Siliguri have distinct vertical metric heights compared to fallback system fonts, a noticeable Cumulative Layout Shift (CLS) occurs on initial render when web fonts swap in.

---

## 6. SEO & Meta Architecture Audit

| Metric | Status | Finding |
| :--- | :--- | :--- |
| **`robots.txt`** | ❌ Missing | No `robots.txt` exists; crawlers have access to all routes including `/admin` |
| **`sitemap.xml`** | ❌ Missing | No `sitemap.xml` generated for catalog or categories |
| **JSON-LD Schema** | ❌ Missing | Zero structured data for `Product`, `Organization`, `LocalBusiness`, or `FAQPage` |
| **Meta Tags** | ⚠️ Outdated | Obsolete `keywords` meta tag present in `app/layout.tsx` |
| **Page Titles** | ⚠️ Partial | Missing `generateMetadata` on `/products`, `/track-order`, `/checkout`, `/saved` |
| **Open Graph Images** | ⚠️ Flawed | Product OG images point to raw Unsplash URLs without 1200x630 dimensions |
| **Canonical URLs** | ❌ Missing | No canonical tags (`alternates.canonical`) configured on any page |

---

## 7. Comprehensive Admin Panel Audit (Screen by Screen)

We walked every single administrative view in the codebase:

### Screen 1: Admin Login (`/admin/login`)
- **Functionality**: Submits email/password to Supabase Auth (`signInWithPassword`).
- **Issues**:
  - Displays hardcoded demo credentials `admin@dreamhome.com / dreamhome123`.
  - Button "[ডেমো ক্রিডেনশিয়ালস ফিল করুন]" auto-fills inputs.
  - Button "ডেমো মোডে প্রবেশ করুন →" bypasses Supabase Auth entirely by setting `dhd_demo_admin=true` cookie.
  - Lacks rate limiting or account lockout after repeated failed attempts.
  - Uses `window.location.href = '/admin'` instead of Next.js router.
  - No "Forgot Password" or self-service password reset capability.

### Screen 2: Dashboard Overview (`/admin`)
- **Functionality**: Displays 4 metric cards (Total Revenue, Pending, In Production, Confirmed) and recent 6 orders.
- **Issues**:
  - Revenue calculation sums all non-cancelled orders (`o.status !== 'cancelled'`), failing to distinguish between placed orders and actual collected revenue (Delivered vs Placed).
  - No date filtering (Today, This Week, This Month).
  - No top-selling product widgets, low-stock alerts, or "Needs Attention" warnings.
  - On failure, silently renders `MOCK_SAMPLE_ORDERS` (giving the owner a false sense of activity).

### Screen 3: Orders Manager (`/admin/orders`)
- **Functionality**: Lists orders with search, status tabs, status dropdown, view detail modal, and printable courier slip.
- **Issues**:
  - Search and filter happen purely client-side on the first 20-50 fetched rows; no server pagination or date-range filtering.
  - **No Item Editing**: Staff cannot edit ordered items, adjust colors, modify quantities, or correct customer delivery addresses before shipping.
  - **Cancellation Without Reason**: Setting status to "Cancelled" does not log a cancellation reason or note.
  - **No Order Audit Trail**: There is no history log of who changed the status, when, or why.
  - **Courier Slip Modal**: Printable slip is a basic HTML table; lacks barcodes/QR codes for courier scanning.
  - **bKash/Nagad Payment Tracking**: No workflow to mark transaction IDs as verified/unverified, record partial advance payments, or track remaining due amounts.
  - **No Fraud / Duplicate Warning**: Does not highlight past cancellation or return history for the customer's phone number.

### Screen 4: Products Catalog (`/admin/products` & `/admin/products/[id]`)
- **Functionality**: Displays product table; allows editing existing items or creating new products.
- **Issues**:
  - **Hard Deletes**: Clicking "ডিলিট" executes `supabase.from('products').delete()`, permanently destroying product records and breaking existing customer order item references.
  - **No Real Image Upload**: `ImageKitUrlManager.tsx` does NOT upload image files. It is an input box that only accepts pasted URLs.
  - **Mock Buttons**: Provides buttons that paste Unsplash images into the input field for testing.
  - **No Variant Model**: Colors are stored as a comma-separated text string (`colorsText.split(',')`). Inventory stock cannot be tracked per color or size.
  - **No Cost Price**: No internal field to calculate profit margins.

### Screen 5: Site Settings (`/admin/settings`)
- **Functionality**: Form to edit site name, hotline, WhatsApp number, Facebook link, address, delivery charges, announcement text, and bKash number.
- **Issues**:
  - Has image URL fields for logo and cover banner, but again no file upload mechanism.
  - No toggle to control the "নমুনা ছবি" (placeholder) badge.
  - No business hours, social links other than Facebook, or order ID prefix settings.

### Screen 6: Workshop Section Editor (`/admin/workshop`)
- **Functionality**: Form to edit workshop header, steps, and video card.
- **Issues**:
  - Writes directly to `data/workshop.json` using Node.js `fs`, which breaks in serverless environments.
  - Step images are URL inputs only.

### Screen 7: Campaigns & Giveaway Manager (`/admin/campaigns`)
- **Functionality**: Allows creating and toggling active status on promotional giveaway banners.
- **Issues**:
  - Writes to `data/campaigns.json` using `fs`.
  - Banner images are URL inputs only.
  - Lacks coupon code generation or discount logic.

### 7.1 Admin Role & Protection Matrix
- **Roles & Permissions**: Does NOT exist. No distinction between Owner, Manager, or Workshop Staff.
- **Audit Logging**: Does NOT exist. No record of product edits, price modifications, or status changes.
- **API Protection**: No API routes exist; Server Actions are 100% unprotected.

---

## 8. E-commerce Gap Analysis for Bangladeshi Furniture Market

| Essential Requirement | Current State | Impact |
| :--- | :--- | :--- |
| **District & Upazila Selectors** | Raw text address + binary zone (inside/outside Dhaka) | High rate of delivery failures and courier sorting errors |
| **Fraud & Fake Order Detection** | No validation; order accepted instantly | Vulnerable to prank orders, competitors spamming, and courier losses |
| **Automated Order Notifications** | No SMS, no Telegram bot, no email | Owner must constantly refresh admin; customer receives no instant confirmation |
| **Courier Integration (Steadfast/Pathao)**| None; manual data entry into courier portal | High operational overhead and manual dispatch delays |
| **bKash/Nagad Payment Verification** | Static text "Send Money to 01712-345678" | Unverified claims; owner cannot match TrxIDs easily |
| **Custom Size / Furniture Inquiries** | WhatsApp link only; no structured request form | Missed sales for custom dimensions and apartments |
| **Real Factory Photography Pipeline** | 100% stock Unsplash photos | Customer skepticism; high risk of return upon delivery |
| **Policy & Legal Pages** | None (No Return Policy, Terms, Privacy, About, Contact)| Weakens customer trust and violates Facebook Ad compliance |
| **Product Specifications & Care** | Basic dimensions text only | Customers unaware of board thickness, weight capacity, or water resistance |

---

## 9. Prioritized Action Plan

### Phase 1: Security & Data Integrity (P0 — Immediate Blockers)
1. **Purge Demo Bypass & Hardcoded Credentials**:
   - Completely delete demo credentials, the "fill credentials" button, and demo-mode cookie handler from `/admin/login`.
   - Strip all public links to `/admin` from `Navbar`, mobile drawer, and `Footer`.
   - Inject `<meta name="robots" content="noindex, nofollow" />` across all `/admin` routes.
2. **Harden Authentication & Session Management**:
   - Implement real hashed authentication with Supabase Auth or argon2/bcrypt.
   - Enforce `httpOnly`, `Secure`, `SameSite=Lax` cookies with strict session lifetimes.
   - Protect all admin pages AND every Server Action with server-side session checks.
   - Introduce 3-tier Role-Based Access Control (RBAC): `Owner`, `Manager`, `Staff`.
3. **Plug the Order Tracking PII Leak**:
   - Require **Order Number AND Customer Mobile Number** together to view status.
   - Mask customer phone numbers (`017****678`) and truncate addresses to District/Area.
   - Rate limit lookups by IP and phone.
4. **Enforce Server-Side Pricing & Zod Validation**:
   - Validate all order inputs with `zod`: strict Bangladeshi mobile normalization (`+8801[3-9]XXXXXXXX`), address length, allowed zones.
   - Compute prices, delivery charges, and totals exclusively on the server from database tables. Reject any price submitted by the client.
5. **Fix Database RLS Policies**:
   - Revoke public `SELECT USING (true)` on `orders` and `order_items`. Allow lookups only via secure server actions or authenticated admin queries.
6. **Isolate Admin Shell from Storefront**:
   - Separate storefront and admin routes using Next.js route groups `app/(storefront)` and `app/(admin)`.
7. **Inject Security Headers**:
   - Configure CSP, HSTS, X-Frame-Options, Referrer-Policy, and Permissions-Policy in `next.config.mjs`.

### Phase 2: Database Architecture & Order Flow (P1)
1. **Schema Expansion**:
   - Add missing tables: `product_images`, `product_variants`, `order_status_history`, `order_notes`, `customers`, `reviews`, `coupons`, `delivery_zones`, `site_media`, `site_content`, `admin_users`, `audit_log`, `abandoned_checkouts`, `custom_requests`.
2. **Safe Order Numbering**:
   - Replace `Math.random()` with collision-safe sequential numbering (`DHD-1001` via PostgreSQL sequence).
3. **Instant Notifications**:
   - Set up Telegram bot alerts and/or Resend emails to notify the owner immediately when an order is placed.
4. **Order Status Timeline**:
   - Store every status change with timestamp and actor; render clear timeline on tracking page.

### Phase 3: Media Pipeline & Google Drive Importer (P1)
1. **Dual-Stage Image System**:
   - Build `product_images` and `site_media` tables supporting `placeholder`, `drive`, and `upload` sources.
   - Display a tasteful "নমুনা ছবি" (Sample Photo) badge on products using placeholder images, disappearing automatically once real photos are attached.
2. **Google Drive Public Folder Importer**:
   - Build admin page **Media → Import from Google Drive**.
   - Parse Drive folder/file links, download via Google Drive API v3 (or direct link fallback), optimize to WebP/AVIF, upload to permanent storage, generate blur placeholders, and link to products by slug.
3. **Remove All Unsplash Stock Assets**:
   - Eradicate hardcoded Unsplash URLs and fix the duplicate `w=` query parameter bug.

### Phase 4: Admin Panel Overhaul (P1)
1. **Mobile-First 390px Redesign**:
   - Dedicated mobile card views for orders and products; fast one-tap WhatsApp and call buttons.
2. **Order Editing & bKash/Nagad Tracking**:
   - Edit items/address prior to dispatch; track transaction IDs, verification status, and partial advance payments.
3. **Product & Content Management**:
   - Soft-deletes, rich specifications, color/size variant manager, site content editor for announcements, hero, policies, and FAQs.

### Phase 5–10: Design System, Storefront Pages, SEO & QA (P2)
1. **Brand Aesthetic Overhaul**:
   - Warm off-white (`#F7F3EE`), walnut (`#2B1D14`), muted wood (`#8A5A3B`), brass accent (`#B08D57`).
   - Bangla typography pairing: Noto Serif Bengali for headings, Hind Siliguri for body.
   - Consistent numeral formatter (unifying on Bengali or English numerals).
2. **Storefront Expansion**:
   - District/Upazila cascaded checkout, policy pages (Delivery & Return, Terms, Privacy, FAQ, About, Contact), custom furniture request form.
3. **SEO & Performance**:
   - Generate dynamic `sitemap.xml`, `robots.txt` (disallow `/admin` and `/api`), JSON-LD schema (`Product`, `LocalBusiness`, `Organization`), and optimize CWV (LCP < 2.5s).
4. **Automated Verification**:
   - Unit and integration tests for phone validation, price calculation, and order submission.

---

*Phase 0 Audit Complete. Awaiting review before initiating Phase 1.*

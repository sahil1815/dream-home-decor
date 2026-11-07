# TODO-CONTENT.md — Dream Home Decor Content & Credentials Checklist

This document tracks all external assets, credentials, and business decisions requiring the store owner/client's input before official public launch. No unverified facts or placeholders remain undocumented.

---

## 1. Security & Administrative Credentials (High Priority)

- [ ] **Rotate Production Admin Passwords**:
  The prototype credentials have been decommissioned. In `.env.local` or Vercel Environment Variables, configure:
  - `AUTH_SECRET`: A secure 32+ character random string (`openssl rand -base64 32`).
  - `ADMIN_OWNER_EMAIL` & `ADMIN_OWNER_PASSWORD_HASH`: Factory owner's email and bcrypt password hash.
  - `ADMIN_MANAGER_EMAIL` & `ADMIN_MANAGER_PASSWORD_HASH`: Store manager's email and bcrypt password hash.
  - `ADMIN_STAFF_EMAIL` & `ADMIN_STAFF_PASSWORD_HASH`: Packaging and dispatch staff's email and bcrypt password hash.
  *(To generate bcrypt hash: `node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"`)*

---

## 2. Real Contact Information & Workshop Location

- [ ] **Dedicated WhatsApp Business Number**:
  - Current placeholder: `+8801725357873` / `01725357873`
  - *Action*: Confirm the official SIM number linked to the factory WhatsApp Business account.
- [ ] **Customer Support Hotline SIM**:
  - Current: `+8801725357873`
  - *Action*: Confirm the phone number printed on courier slip boxes and invoices for incoming calls.
- [ ] **Mirpur Workshop Exact Address**:
  - Current: `হোল্ডিং নং ২৩, রোড নং ৪, সেকশন-১০, মিরপুর, ঢাকা-১২১৬ (মিরপুর ১০ গোলচত্বর সংলগ্ন)`
  - *Action*: Confirm exact workshop holding/shop number for in-person customer visits and Google Maps pin.
- [ ] **Workshop Visiting Hours**:
  - Current: `প্রতিদিন সকাল ১০:০০ টা থেকে রাত ৮:০০ টা`
  - *Action*: Confirm weekly off-day (if any, e.g., Friday morning) or public holiday schedule.
- [ ] **Facebook Page & Social Links**:
  - Current: `https://www.facebook.com/profile.php?id=61584955311887`
  - *Action*: Verify if a custom Facebook username/vanity URL exists.

---

## 3. Commercial Policies & Payment Credentials

- [ ] **Delivery Charges & Courier Contract**:
  - Current default: Dhaka Metro = ৳120; Outside Dhaka = ৳200.
  - *Action*: Confirm whether these rates match your Steadfast/Pathao courier commercial agreement.
- [ ] **bKash & Nagad Merchant Account**:
  - Current: Manual send-money / payment verification instructions with merchant number.
  - *Action*: Provide bKash/Nagad merchant number or personal SIM for receiving advance delivery charge payments.
- [ ] **Warranty & Replacement Policy**:
  - Current Policy: "ডেলিভারিম্যানের সামনে সম্পূর্ণ প্যাকেট খুলে চেক করে নেওয়া যাবে। পরিবহনে কোনো স্ক্র্যাচ বা ত্রুটি থাকলে সাথে সাথে ফেরত অথবা ৭ দিনের মধ্যে পার্টস রিপ্লেসমেন্ট সরবরাহ করা হবে।"
  - *Action*: Confirm exact warranty window and terms for board hardware.

---

## 4. Third-Party Integrations & API Credentials

- [ ] **Steadfast Courier API Keys**:
  - For automated one-click parcel dispatch from Admin Order Details:
  - `STEADFAST_API_KEY`: API Key from Steadfast Courier Merchant Portal.
  - `STEADFAST_SECRET_KEY`: Secret Key from Steadfast Courier Merchant Portal.
  *(Until configured, client operates in simulated fallback mode with test consignment tracking codes)*
- [ ] **Bangladeshi SMS Gateway Credentials**:
  - For automated customer SMS on order placement, confirmation, and courier dispatch:
  - `SMS_API_KEY`: API Key from Greenweb, BulkSMS BD, Alpha SMS, or generic SMS provider.
  - `SMS_SENDER_ID`: Approved Masking Sender ID (e.g. `DreamHome` or non-masking number).
  - `SMS_GATEWAY_URL`: HTTP POST endpoint for SMS dispatch.
  *(Until configured, SMS notifications are logged safely to server logs without failing)*
- [ ] **Meta (Facebook) Pixel & Conversions API (CAPI)**:
  - `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`: 15-16 digit Meta Pixel ID from Events Manager.
  - `META_CAPI_ACCESS_TOKEN`: System User Access Token with `ads_management` permission.
- [ ] **Google Analytics 4**:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Tag ID (e.g. `G-XXXXXXXXXX`).
- [ ] **Google Drive API Key (Optional)**:
  - `GOOGLE_DRIVE_API_KEY`: Google Cloud Console API Key with "Google Drive API v3" enabled for automated folder scanning.
  *(Optional: If not provided, admin can paste direct shareable links manually)*

---

## 5. Authentic Photography Checklist (Required from Mirpur Workshop)

To replace all local placeholders and automatically remove the `নমুনা ছবি` (Sample Photo) badge from the storefront, provide high-resolution photos in 4:3 or 16:9 aspect ratio:

### A. Site & Workshop Pipeline Assets (`public/placeholders/site/` or Drive Folder `site/`)
- [ ] **Hero Banner** (`hero.jpg`): Landscape photo (min 1920x1080) of master craftsmen working in the Mirpur workshop or signature finished setup.
- [ ] **Workshop Step 1** (`workshop_1.jpg`): Craftsmen cutting 16mm melamine density boards on table saws.
- [ ] **Workshop Step 2** (`workshop_2.jpg`): Precision 1mm PVC edge banding machine applying heat-sealed edge sealing.
- [ ] **Workshop Step 3** (`workshop_3.jpg`): Assembly, anti-rust screws, and drawer glide fitting.
- [ ] **Workshop Step 4** (`workshop_4.jpg`): Double-layer bubble wrap, edge corner protectors, and corrugated packaging.
- [ ] **Workshop Team** (`about_team.jpg`): The master craftsmen and team in the Mirpur workshop.
- [ ] **Factory Display & Inspection Corner** (`showroom.jpg`): Customer inspection area in Mirpur-10.

### B. Catalog Product Photos (4+ Angles Each in Natural Lighting)
- [ ] **Smart Ergonomic Reading Table** (`smart-ergonomic-reading-table/`):
  - `01.jpg`: Front elevation showing full bookshelf and table height.
  - `02.jpg`: 45-degree angle showing depth, leg space, and book cubbies.
  - `03.jpg`: Macro close-up of 1mm PVC edge banding and melamine finish.
  - `04.jpg`: In-room lifestyle setup with study lamp and books.
- [ ] **Compact Student Study Table** (`compact-student-study-table/`):
  - `01.jpg`: Front elevation.
  - `02.jpg`: Open cabinet and drawer showing lock and internal space.
  - `03.jpg`: 45-degree angle.
  - `04.jpg`: Compact corner study setup.
- [ ] **Executive Workstation & Computer Desk** (`executive-workstation-computer-desk/`):
  - `01.jpg`: Front perspective view.
  - `02.jpg`: Cable grommet and CPU/keyboard tray detail.
  - `03.jpg`: Heavy-duty hardware fitting and joint inspection.
  - `04.jpg`: Home office workstation setup.
- [ ] **Modern Multi-Tier Bookshelf** (`modern-multi-tier-bookshelf/`):
  - `01.jpg`: Full vertical elevation.
  - `02.jpg`: Shelf board thickness (16mm) and joint detail.
  - `03.jpg`: 45-degree angle showing display depth.
  - `04.jpg`: Living room lifestyle photo with books and decor.

---

## 6. Real Customer Reviews & Testimonials

- [ ] **Genuine Reviews & Photos**:
  - The storefront customer reviews section remains hidden until real verified reviews are approved in `/admin/reviews`.
  - *Action*: Collect 3-5 real WhatsApp or Facebook chat feedback screenshots with photos of installed tables from past customers.
  - Enter them via `/admin/reviews` with customer name, rating, district, and optional room photo.

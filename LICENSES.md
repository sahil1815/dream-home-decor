# Media Licenses & Asset Register — Dream Home Decor

This document records the provenance, licensing status, and asset identifiers for all photographic and graphic assets in the codebase.

---

## 1. Local Brand & Factory Photos (`/public/brand-images/` and `/public/placeholders/`)
Original photographs produced by Dream Home Decor workshop in Mirpur-10, Dhaka.

| File Path | Description | Provenance | License / Watermark Status |
| :--- | :--- | :--- | :--- |
| `reading_table_study_desk.jpg` | Smart Ergonomic Reading Table & Bookshelf | Mirpur-10 Workshop Shoot | Brand Owned. Unwatermarked. Clean. |
| `factory_furniture_workshop.jpg` | Board cutting & PVC edge-banding machine | Mirpur-10 Factory Floor | Brand Owned. Unwatermarked. Clean. |
| `bookshelf_corner_shelf_2.jpg` | Modern Multi-Tier Bookshelf & Corner Rack | Factory Display Room | Brand Owned. Unwatermarked. Clean. |
| `corner_shelf_1.jpg` | Floating Wall Shelf & Bracket Set | Factory Workshop | Brand Owned. Unwatermarked. Clean. |
| `cover_banner.jpg` | Factory Cover Banner & Workshop Lifestyle | Brand Marketing Asset | Brand Owned. Unwatermarked. Clean. |
| `official_brand_logo.jpg` | Dream Home Decor Official Logo | Brand Design | Brand Owned. Unwatermarked. Clean. |
| `bangle_box_1.jpg` | Dressing Table Bangle Organizer Unit | Workshop Showcase | Brand Owned. Unwatermarked. Clean. |
| `bangle_box_wide.jpg` | Modern Dressing Unit Display | Workshop Showcase | Brand Owned. Unwatermarked. Clean. |
| `bangle_jewelry_box_2.jpg` | Compact Study Table Drawer Unit | Workshop Showcase | Brand Owned. Unwatermarked. Clean. |

---

## 2. Product Placeholder Mapping (`/public/placeholders/products/`)

| Product Slug | Placeholder Files | Status | Watermarked? |
| :--- | :--- | :--- | :--- |
| `smart-ergonomic-reading-table` | `01.jpg`, `02.jpg` | Temporary Stand-in | **No** (Clean local factory asset) |
| `compact-student-study-table` | `01.jpg`, `02.jpg` | Temporary Stand-in | **No** (Clean local factory asset) |
| `executive-workstation-computer-desk` | `01.jpg`, `02.jpg` | Temporary Stand-in | **No** (Clean local factory asset) |
| `modern-multi-tier-bookshelf` | `01.jpg`, `02.jpg` | Temporary Stand-in | **No** (Clean local factory asset) |
| `floating-geometric-wall-shelf-set` | `01.jpg`, `02.jpg` | Temporary Stand-in | **No** (Clean local factory asset) |
| `luxurious-mirror-dressing-table` | `01.jpg`, `02.jpg` | Temporary Stand-in | **No** (Clean local factory asset) |

---

## 3. Site Media Slots (`/public/placeholders/site/`)

| Slot | File | Purpose | Source |
| :--- | :--- | :--- | :--- |
| `hero` | `hero.jpg` | Homepage Hero Banner | Brand Owned |
| `workshop_1` | `workshop_1.jpg` | Board Cutting Process | Factory Floor |
| `workshop_2` | `workshop_2.jpg` | Edge Banding Application | Factory Floor |
| `workshop_3` | `workshop_3.jpg` | Precision Assembly | Factory Floor |
| `workshop_4` | `workshop_4.jpg` | Final Packing & Inspection | Factory Floor |
| `showroom` | `showroom.jpg` | Mirpur-10 Display Center | Workshop Showroom |
| `about_team` | `about_team.jpg` | Craftsmen & Carpenter Team | Factory Floor |
| `about_workshop` | `about_workshop.jpg` | Factory Infrastructure | Factory Floor |
| `og_default` | `og_default.jpg` | Open Graph Social Card (1200x630) | Brand Marketing |

---

## 4. Google Drive Production Import Pipeline (Stage 2)
When real product photography is uploaded to the designated Google Drive folder:
- Files will be imported through the **Admin Media → Google Drive Import** interface.
- Files will be validated, stripped of metadata/GPS, optimized, and saved with `source = 'drive'` and `is_placeholder = false`.
- The `"নমুনা ছবি"` (Sample Photo) badge will be removed automatically once imported images are active.

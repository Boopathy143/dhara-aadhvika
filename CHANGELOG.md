# CHANGELOG.md

All notable changes to **Dhara Aadhvika**. Format roughly follows [Keep a Changelog](https://keepachangelog.com/). Dates in IST.

---

## [Unreleased]

### Planned
- Phase 4 — Customer Ledger (statement, PDF/Excel export, date filter)
- Phase 5 — Quotation system (draft → sent → accepted → converted)
- Phase 6 — GST Tax Invoice (HSN, CGST/SGST/IGST, QR) — **blocked on real GSTIN + FSSAI**
- Phase 9 — Reviews moderation queue, low-stock alerts, sales/GST reports, search analytics
- Rate limiting on `/auth/*`
- S3 / R2 migration for banner + payment-receipt storage

---

## [1.8.0] — 2026-06-25

### Added (Phase 8 — Distance-based delivery)
- Backend
  - `delivery_settings` collection (storePincode, slabs, freeDeliveryThreshold, fallbackPolicy)
  - `pincodes` collection with admin CRUD + bulk-import
  - `GET /api/delivery/quote?pincode=&subtotal=` (public)
  - `GET / PUT /api/admin/delivery`
  - `POST /api/admin/delivery/pincodes` (single or `{items: [...]}` bulk)
  - `DELETE /api/admin/delivery/pincodes/:pincode`
  - `ensurePincodesSeeded()` — idempotent seed of 8 PIN codes around Erode (638502)
  - Order creation server-side re-validates the PIN — undeliverable PINs → 400
- Frontend
  - `app/checkout/page.js` — live PIN quote, distance + slab + ₹/FREE banner, "outside zone" error, COD/UPI buttons disable when undeliverable
  - `app/admin/_delivery.jsx` — store-PIN, slabs, free threshold, fallback policy, PIN-table search + add + bulk-CSV-import + delete, inline test-a-PIN widget

### Fixed
- **`Cannot access 'f' before initialization`** TDZ bug at `POST /api/orders` — hoisted `DEFAULT_DELIVERY`, `getDeliverySettings`, `quoteDelivery` from inside `handle()` to module top scope. Phase 8 v1 had them declared inside `handle()` below `/orders` POST, which caused the minifier to fail at runtime.

### Documentation
- New `/app/PROJECT_MASTER_DOCUMENTATION.md` (1100+ lines)
- New `/app/AI_PROJECT_CONTEXT.md`, `/app/AI_DEBUG_PROMPT.md`, `/app/DEPLOYMENT_CHECKLIST.md`, `/app/ERROR_PLAYBOOK.md`, `/app/DATABASE_BACKUP_GUIDE.md`, `/app/SYSTEM_REQUIREMENTS.md`, `/app/ARCHITECTURE_DIAGRAMS.md`, `/app/QUICK_START.md`, `/app/CHANGELOG.md`, `/app/.env.example`

---

## [1.7.0] — 2026-06-25 (Phase 16 — Advanced Admin CMS)

### Added
- `site_settings` collection — single doc with company / socials / page-content overrides
- `GET /api/settings` (public) — Footer / Contact / policy pages consume it dynamically
- `GET / PUT /api/admin/settings`
- `banners` collection + `GET /api/banners` (public) + admin CRUD
- `GET /api/admin/users/:id/details` — returns user + orders + addresses
- `PUT /api/admin/users/:id` — edit name/email/role, activate/deactivate, reset password
- `DELETE /api/admin/users/:id` — cascades cart/addresses/wishlist
- Deactivated users (`active: false`) blocked from login (password + OTP paths)
- Self-admin protection — admins can't demote/deactivate/delete themselves
- New admin tabs in `/admin`:
  - **Banners** — upload (≤1.5 MB) / URL, reorder, active toggle, CTA text+link
  - **Site Settings** — sub-tabs:
    - Company Info (name, owner, address, phone, WhatsApp, email, GSTIN, FSSAI)
    - Social Links (Instagram, Facebook, YouTube, X)
    - Page Content (homepage hero copy, about, contact intro, terms, privacy, shipping, refund — with live preview)
  - **Users (revamped)** — search by name/email + actions (edit/reset-password/activate/deactivate/delete) + activity dialog (orders + addresses)

### Changed
- `components/Footer.jsx` — pulls live company info + socials from `/api/settings`
- `components/ContentPage.jsx` — accepts `cmsKey` to render admin-edited content
- `app/contact/page.js`, `app/terms/page.js`, `app/privacy/page.js`, `app/refund-policy/page.js`, `app/shipping-policy/page.js` — wired to `cmsKey`

### Removed
- Demo credential hint from `/login` and `/admin` access-denied page
- Old plain Users tab inside `app/admin/page.js`

### SEO & Production-readiness
- New `app/sitemap.js` — dynamic sitemap.xml lists products + categories + static pages
- New `app/robots.js` — dynamic robots.txt disallows /admin /checkout /orders /cart /api
- `app/layout.js` — full OpenGraph + Twitter card + canonical URLs via `NEXT_PUBLIC_BASE_URL`
- `/app/DEPLOYMENT.md` — production deployment runbook for dharaaadhvika.in

---

## [1.6.0] — 2026-06-25 (Bug-fix iteration)

### Fixed
- INR symbol (`₹`) in PDF invoices rendered as `?`/blank because jsPDF's helvetica lacks the glyph → invoices now use `"Rs."` prefix everywhere via `inrPdf()` from `lib/format.js`. On-screen rendering continues to use `₹` via `inr()`.

### Added
- Payment Receipt full-screen viewer in admin (`app/admin/page.js → ReceiptViewer`) with zoom in/out for images, native iframe for PDFs, download + open-in-new-tab
- UPI receipt upload accepts JPG / PNG / PDF (≤2 MB)
- Order statuses extended for UPI: `payment_verification_pending`, `payment_rejected`
- `POST /api/admin/orders/:id/verify-payment` `{action: 'approve'|'reject', reason?}`
- `paymentRejectionReason` stored on order
- Status timeline on `/orders/:id` handles `payment_rejected` gracefully

---

## [1.5.0] — 2026-06-25 (Phase 2 & 3 — Units + Specifications)

### Added
- Product unit selection — 11 options (`Kg`, `Gram`, `Litre`, `ml`, `Piece`, `Pack`, `Box`, `Bottle`, `Bag`, `Dozen`, `Bundle`)
- Product specification fields: `usage`, `storage`, `shelfLife`, `manufacturer`, `countryOfOrigin`, `fssaiNumber`, plus refined `ingredients`, `benefits`, `nutrition`
- Specs render on product detail page (`/products/:id`) under "Specifications" tab
- Pack size shown on PDP, cart, checkout, invoice via `formatPack()`
- Order items now snapshot `weight` and `unit` for accurate invoices

---

## [1.4.0] — 2026-06-25 (Phase 7 — Returns)

### Added
- Per-line-item return request with reason (Damaged / Wrong / Expired / Quality Issue / Missing Item / Other), description, photo / PDF proof (≤2 MB)
- 9-stage return workflow: `pending → under_review → approved/rejected → pickup_scheduled → pickup_completed → refunded/replaced → closed`
- Refund-status tracker (`not_initiated / processing / refunded`)
- Replacement-status tracker (`not_applicable / pending / dispatched / delivered`)
- Admin Returns tab — view list, photo proof viewer, status dropdowns
- Customer side — "Request Return" button on delivered orders in `/orders`

---

## [1.3.0] — 2026-06-25 (Phase: SMTP wired)

### Added
- Gmail SMTP integration via `nodemailer@6.9.14` (`lib/email.js`)
- Branded HTML email template for signup OTP, login OTP, password reset
- `sendOtpEmail()` and `sendPasswordResetEmail()` helpers
- Forgot-password flow switched from 64-char UUID token to 6-digit code with 30-minute TTL — better UX in email
- Email-OTP login (`/auth/otp/send` → `/auth/otp/verify`) actually sends now instead of console-logging

### Changed
- All auth endpoints return 500 with explicit error message when SMTP send fails (no silent dev-code fallback in production)
- Login page demo creds removed (`admin@dhara.com / admin123`)

---

## [1.2.0] — 2026-06-25 (Initial import)

### Added
- Imported `ecommerce-project-updated.zip` (Next.js 15 storefront for "Dhara Aadhvika")
- FastAPI reverse-proxy at `/app/backend/server.py` (`httpx` async) — required only in the Emergent preview pod to bypass K8s `/api/*` → port-8001 routing
- Updated `frontend/.env` (MONGO_URL, DB_NAME, NEXT_PUBLIC_BASE_URL, AUTH_SECRET)
- `yarn install` + `yarn build` — green, 29 routes generated

### Fixed
- Blank preview page caused by `next start` + `output: 'standalone'` warning (harmless on Vercel; in preview pod confirmed serving)
- K8s ingress collision: Next.js API routes at `/api/*` were being routed to port 8001 (FastAPI) instead of port 3000 (Next.js). Resolved by running FastAPI as a transparent proxy

### Branding
- Updated company info to: Dhara Aadhvika · Proprietor Boopathy.K · 40 Puthumanjalanaicanur, Nagalur, Anthiyur, Erode TN 638502 · WhatsApp 9384948663 · boopathyboopathy298@gmail.com
- Social links wired in `lib/company.js`: Instagram, Facebook, YouTube, X

---

## [1.1.0] — Original project (date unknown, imported as-is)

Initial Next.js + MongoDB e-commerce skeleton with:
- Catalogue (categories, brands, products, search, filters, sort)
- Cart + wishlist (server-side, per-user)
- Checkout with UPI + COD (UPI used flat ₹49 / FREE above ₹999 shipping)
- Admin panel — products, orders, users, coupons, reviews tabs
- Email OTP signup + password login + email-OTP login
- 30 seeded products across 8 categories, 4 brands, 3 coupons
- Invoice PDF download from My Orders
- Order tracking timeline
- Reorder functionality
- Address book

---

## Version policy

- **Major bump** (`2.0.0`): breaking API changes, DB migration required.
- **Minor bump** (`1.x.0`): new phase / feature complete.
- **Patch bump** (`1.x.y`): bug fixes only.

To release:
1. Bump version in `package.json`.
2. Append a new section here.
3. Commit, tag (`git tag v1.x.y`), push tags.
4. Vercel auto-deploys on push to main.

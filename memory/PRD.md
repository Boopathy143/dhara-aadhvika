# Dhara Aadhvika — PRD & Implementation Log

## Original problem statement
User imported a Next.js 15 + MongoDB e-commerce project (`ecommerce-project-updated.zip`) and asked the assistant to (1) get it running on the preview URL, (2) wire Gmail SMTP and remove the on-screen dev OTP display, and (3) iteratively ship 10 phases of e-commerce features starting with bug fixes, product unit selection, product specifications, return management, distance-based delivery, GST tax invoicing, customer ledger, quotation system, plus a list of e-commerce essentials (wishlist, reviews moderation, coupons, analytics, SEO, etc.). UI / branding / navigation must NOT be redesigned.

## Architecture
- **Frontend & backend in one repo** at `/app/frontend` (Next.js 15 App Router; API routes live in `app/api/[[...path]]/route.js`).
- **K8s ingress quirk:** `/api/*` is forced to port 8001. We run a thin FastAPI reverse-proxy on 8001 (`/app/backend/server.py`) that forwards every `/api/*` request to the Next.js server on 3000.
- MongoDB at `mongodb://localhost:27017`, db `ecommerce`.
- Email: Gmail SMTP via `nodemailer` (lib/email.js).
- All branding constants in `/app/frontend/lib/company.js`; formatting helpers (INR, pack/unit, UNIT_OPTIONS) in `/app/frontend/lib/format.js`.

## User personas
- **Customer** — browses products, places COD or UPI orders, uploads UPI payment receipts (JPG/PNG/PDF), requests returns with reason + photo/PDF proof.
- **Admin (Proprietor — Boopathy.K)** — manages products (with units & full spec sheet), verifies UPI payments, processes returns through the extended workflow, manages coupons/reviews.

## Core static requirements
- Preserve UI / branding / navigation across iterations.
- All amounts in INR. On-screen ₹ glyph; PDFs use `Rs.` prefix (jsPDF font safety).
- Real Gmail SMTP for OTP & password-reset; no on-screen dev codes when SMTP is configured.

## What's been implemented

### Iter 1 — 2026-06-25 — Import & boot
- Imported Next.js project under `/app/frontend`.
- Built FastAPI proxy → Next on :3000.
- Ran `yarn install` + `yarn build`; preview URL live.

### Iter 2 — 2026-06-25 — Gmail SMTP & dev-OTP removal
- `.env` updated with real Gmail SMTP creds (`SMTP_HOST/PORT/USER/PASS/FROM`).
- `lib/email.js` — branded HTML template + new `sendPasswordResetEmail()`.
- Removed `devCode`/`devToken` from API responses for `/auth/register`, `/auth/resend-signup-otp`, `/auth/otp/send`, `/auth/forgot`.
- Forgot-password switched from 64-char UUID to a 6-digit emailed code.
- Verified end-to-end: register → email-delivered OTP → verify; forgot → email-delivered code → reset; login OTP send/verify.

### Iter 3 — 2026-06-25 — Phases 1, 2, 3, 7 + branding
- **Branding** — central constants in `lib/company.js`: Dhara Aadhvika / Boopathy.K / 40 Puthumanjalanaicanur, Nagalur, Anthiyur, Erode 638502 / WhatsApp 9384948663 / boopathyboopathy298@gmail.com / Instagram, Facebook, YouTube, X.
- **Footer + Contact page** rewritten to consume `COMPANY` constants and link real social URLs.
- **Phase 1 — INR symbol fix in PDF** — `inrPdf()` helper using "Rs." prefix; `downloadInvoice()` updated end-to-end with new header (FSSAI, GSTIN, support email, WhatsApp) and pack column.
- **Phase 1 — Payment receipt view fix** — `UpiPayment.jsx` now accepts JPG/PNG/PDF; admin `/admin` got a new "Payments" tab + `ReceiptViewer` dialog with zoom, download, open-in-new-tab, plus Verify/Reject (rejection captures a reason). Pending/Verified/Rejected badges shown.
- **Phase 2 — Product unit selection** — `UNIT_OPTIONS` (Kg/Gram/Litre/ml/Piece/Pack/Box/Bottle/Bag/Dozen/Bundle) shown in admin product form as Select; `formatPack(p)` used on product card, product detail, cart/checkout (via item snapshot), and invoice PDF. Order items now snapshot `weight + unit`.
- **Phase 3 — Product specifications module** — admin form has dedicated fields for Ingredients, Benefits, Usage Instructions, Storage Instructions, Shelf Life, Manufacturer, Country of Origin, FSSAI Number, Nutritional Information, plus the existing Key Features / Specs / Additional Information repeaters. Product detail page renders them on Details tab + Specifications tab.
- **Phase 7 — Return management** — return reasons updated to (Damaged Product, Wrong Product, Expired Product, Quality Issue, Missing Item, Other). Return upload accepts PDF. Extended return statuses (pending → under_review → approved/rejected → pickup_scheduled → pickup_completed → refunded/replaced → closed) + Replacement statuses (not_applicable/pending/dispatched/delivered) wired in admin UI; backend PUT `/admin/returns/:orderId/:productId` accepts `replacementStatus`.
- **Order tracking** — `STATUS_TO_STAGE` maps `payment_verification_pending` and `payment_rejected` to the canonical flow so the tracker stays consistent for UPI orders.

**Tested**: testing-agent iter_1.json — backend 14/14 pass, frontend 100%, zero issues.

## Prioritized backlog (next iterations)
- **P0 — Phase 8: Distance-based delivery**: Store-location PIN, distance slabs (0–5 km ₹30, 5–10 km ₹50, 10–15 km ₹70, 15–20 km ₹100, >20 km not deliverable), free-delivery threshold, customer PIN validation at checkout. *Needs the Maps API approach decision: real Google Maps key or a static PIN-distance table.*
- **P0 — Phase 6: Proper GST tax invoice**: HSN column, CGST/SGST/IGST split, QR code (UPI intent), payment-status seal.
- **P1 — Phase 4: Customer ledger**: opening balance, order/payment/refund/return ledger entries, statement view, PDF + Excel export, date filter.
- **P1 — Phase 5: Quotation system**: admin-created quotes with discount/GST, PDF, email send, status (draft/sent/accepted/rejected/converted).
- **P1 — Phase 9 — high-impact subset**: review approval workflow, low-stock report, top-selling products report, GST report (period filter), basic SEO meta fields per product + sitemap.xml.
- **P2 — Phase 9 — remainder**: SMS-ready notifications, recently viewed (server-side), inventory adjustment history, customer/product analytics dashboards.

## Open questions for user
- Phase 8 Maps integration: do you want a paid Google Maps Distance Matrix API (provide key) OR a built-in PIN-code → distance lookup table maintained by admin? The latter is free and works offline; the former is more accurate.
- Real FSSAI license number + GSTIN to embed in the tax invoice (currently placeholders 12345678901234 / 33ABCDE1234F1Z5).

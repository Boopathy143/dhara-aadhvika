# Dhara Aadhvika — PRD

## Original Problem
Import a Next.js ecommerce project, fix build errors, deploy and incrementally add: Gmail SMTP OTP, returns, product specs, units, payment receipt viewer, INR/PDF fixes, CMS, user management, SEO, deployment guide, distance-based delivery, ledger, quotations, GST invoice. Brand: Dhara Aadhvika by Boopathy.K, Erode TN, WhatsApp 9384948663, support boopathyboopathy298@gmail.com.

## Architecture
- Next.js 15 (app router) at /app/frontend — serves storefront + /api/*
- FastAPI reverse proxy on :8001 forwards to Next.js :3000 (K8s ingress routes /api/* to backend)
- MongoDB collections: products, users, orders, carts, wishlists, addresses, coupons, reviews, otps, signup_otps, pwresets, site_settings, banners, contact_messages, newsletter, pincodes, delivery_settings, _meta

## Implemented (cumulative)
- [2026-06-25] Imported ecommerce-project-updated.zip; FastAPI reverse-proxy; built + deployed.
- Gmail SMTP OTP (signup, login, password reset, resend) — no dev codes leaked.
- Returns workflow (9 statuses) — user side + admin side + PDF proof + replacement status.
- Product specs (ingredients/benefits/usage/storage/shelf-life/manufacturer/country/FSSAI/nutrition) + unit selection (11 units) end-to-end.
- Payment receipt viewer (admin) with zoom/download/full-screen + Pending/Verified/Rejected.
- INR fixed in PDF ("Rs." prefix) + invoice with full company info, FSSAI, GSTIN.
- Footer + Contact use real company info; consume /api/settings dynamically.
- Phase 16 CMS: /admin/settings + /admin/banners CRUD; admin UI for Company Info, Social Links, Page Content (terms/privacy/shipping/refund), Banners, Users panel with search/edit/reset-pw/activate/deactivate/delete/view orders+addresses.
- Demo credentials removed; deactivated users blocked from login.
- SEO: dynamic sitemap.xml + robots.txt + OpenGraph/Twitter metadata + NEXT_PUBLIC_BASE_URL canonicals.
- /app/DEPLOYMENT.md production guide for dharaaadhvika.in.
- **Phase 8 PIN-distance delivery**: store-pincode origin (638502), editable slabs (0-5km/5-10km/10-15km/15-20km), free-delivery threshold, fallback policy (block/flat), pincodes lookup CRUD with bulk-import (csv-style), inline test in admin, checkout fetches quote on PIN entry (blocks if undeliverable, shows distance+slab+free banner), order creation re-validates server-side. 8 nearby PINs seeded on first run.

## Backlog (prioritized)
- P0 Phase 6: GST tax invoice with HSN/CGST/SGST/IGST/QR — BLOCKED on real GSTIN + FSSAI
- P0 Phase 4: Customer ledger (opening balance, payments, refunds, statement PDF/Excel)
- P1 Phase 5: Quotation system (draft/sent/accepted/converted)
- P1 Phase 9: reviews moderation queue, low-stock alerts, sales/GST reports, search analytics
- P2 Migrate base64 banner/receipt storage to S3/Cloudflare R2
- P2 Tiptap WYSIWYG for CMS (currently plain-text with newlines + preview)
- P2 WhatsApp order notification ping


## 2026-06-25 — Phase 4 Customer Ledger
- New collection `ledger_entries` (manual debit/credit adjustments)
- Endpoints: `GET /admin/ledger/users`, `GET /admin/ledger/users/:id?from=&to=`, `POST /admin/ledger/entries`, `DELETE /admin/ledger/entries/:id`
- Auto-derived entries from orders (debit on place, credit on COD-delivered / UPI-verified, credit on refund per item)
- Admin Ledger tab: customer list with outstanding sorted desc; per-customer statement with date filter, running balance, manual-entry dialog, Print / CSV export / PDF export (jsPDF + autoTable, "Rs." prefix)
- E2E verified — 2 customers, ₹1721 outstanding after manual ₹100 credit, date filter narrows entries

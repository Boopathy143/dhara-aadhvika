# Dhara Aadhvika — PRD

## Original Problem
Import a Next.js ecommerce project, fix build errors, deploy and incrementally add: Gmail SMTP OTP, returns, product specs, units, payment receipt viewer, INR/PDF fixes, CMS, user management, SEO, deployment guide. Brand: Dhara Aadhvika by Boopathy.K, Erode TN, WhatsApp 9384948663, support boopathyboopathy298@gmail.com.

## Architecture
- Next.js 15 (app router) at /app/frontend — serves storefront + /api/*
- FastAPI reverse proxy on :8001 (K8s ingress routes /api/* to backend) forwards to Next.js :3000
- MongoDB via MONGO_URL; collections: products, users, orders, carts, wishlists, addresses, coupons, reviews, otps, signup_otps, pwresets, site_settings, banners, contact_messages, newsletter

## Implemented
- [2026-06-25] Imported ecommerce-project-updated.zip, wired FastAPI reverse-proxy, built + deployed.
- Gmail SMTP OTP (signup, login, password reset, resend) — no dev codes leaked.
- Returns workflow (9 statuses) — user side + admin side + PDF proof + replacement status.
- Product specs (ingredients, benefits, usage, storage, shelf life, manufacturer, country of origin, FSSAI, nutrition) + unit selection (11 units) on create/edit/display/cart/checkout/PDF.
- Payment receipt viewer (admin) with zoom/download/full-screen + Pending/Verified/Rejected workflow.
- INR fixed in PDF (uses "Rs." prefix; on-screen uses ₹) + updated invoice with company info, FSSAI, GSTIN.
- Footer + Contact rebuilt with real company info; reads dynamically from /api/settings.
- Phase 16 CMS: /admin/settings + /admin/banners CRUD; admin UI for Company Info, Social Links, Page Content (terms/privacy/shipping/refund); admin Users panel with search, edit, reset-password, activate/deactivate, delete, view orders/addresses.
- Login page demo credentials removed; deactivated users blocked from login.
- SEO: sitemap.xml (dynamic — products + categories), robots.txt, OpenGraph/Twitter metadata, NEXT_PUBLIC_BASE_URL for canonicals.
- /app/DEPLOYMENT.md production deployment guide for dharaaadhvika.in.

## Backlog (prioritized)
- P0 Phase 8: PIN-code distance-based delivery (admin-maintained lookup)
- P0 Phase 6: GST tax invoice with HSN/CGST/SGST/IGST/QR — BLOCKED on user-provided real GSTIN + FSSAI
- P1 Phase 4: Customer ledger (opening balance, payments, refunds, statement PDF/Excel)
- P1 Phase 5: Quotation system (draft/sent/accepted/converted)
- P2 Phase 9: Reviews moderation queue, low-stock alerts, sales/GST reports, search analytics
- P2 Image management: migrate banner/receipt storage from base64 to S3/Cloudflare R2
- P2 WYSIWYG editor for CMS (Tiptap) — currently plain-text with newlines + preview


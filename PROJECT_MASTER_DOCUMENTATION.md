# PROJECT MASTER DOCUMENTATION

> **Dhara Aadhvika** — premium organic foods e-commerce platform.  
> Last updated: 2026-06-25.  
> Audience: developers, future maintainers, AI assistants (Claude, ChatGPT, Gemini, Cursor, OpenCode, GitHub Copilot).

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Complete Folder Structure](#3-complete-folder-structure)
4. [Database Documentation](#4-database-documentation)
5. [API Documentation](#5-api-documentation)
6. [Authentication Flow](#6-authentication-flow)
7. [Order Flow](#7-order-flow)
8. [Admin Panel Documentation](#8-admin-panel-documentation)
9. [Environment Variables](#9-environment-variables)
10. [Build & Run Instructions](#10-build--run-instructions)
11. [Deployment Guide](#11-deployment-guide)
12. [Domain Connection Guide](#12-domain-connection-guide)
13. [Third-Party Services](#13-third-party-services)
14. [Security Documentation](#14-security-documentation)
15. [Error Troubleshooting Guide](#15-error-troubleshooting-guide)
16. [Maintenance Guide](#16-maintenance-guide)
17. [Future Improvements](#17-future-improvements)
18. [AI Handover Section](#18-ai-handover-section)

---

## 1. Project Overview

| Field | Value |
|---|---|
| Project name | **Dhara Aadhvika** (legal name: DHARA AADHVIKA) |
| Tagline | "Pure • Honest • Rooted" |
| Domain | dharaaadhvika.in |
| Proprietor | Boopathy.K |
| Address | 40, Puthumanjalanaicanur, Nagalur, Anthiyur, Erode, Tamil Nadu — 638502, India |
| Support email | boopathyboopathy298@gmail.com |
| WhatsApp / Phone | +91 93849 48663 |
| Socials | Instagram, Facebook, YouTube, X (configurable from admin) |

### Purpose
A direct-to-consumer (D2C) e-commerce platform for traditional Indian organic foods — wood-pressed oils, ancient grains, hand-pounded rice, traditional millets, jaggery and herbal products — sourced directly from village farms.

### Business Workflow
1. Customer browses catalogue → filters by category / brand / price / rating.
2. Adds items to cart (must be signed in to mutate cart).
3. Proceeds to checkout, enters address, system computes **PIN-code distance-based delivery charge** in real time.
4. Pays via **UPI** (uploads transaction-ID + receipt JPG/PNG/PDF) or chooses **Cash on Delivery**.
5. UPI orders enter `payment_verification_pending`; admin verifies the receipt and marks the order `confirmed` (or `payment_rejected`).
6. Admin processes the order through `shipped` → `delivered`.
7. After delivery customer can raise a **return request** per line-item with reason + photo proof. Admin walks the return through `pending → under_review → approved/rejected → pickup_scheduled → pickup_completed → refunded/replaced → closed`.
8. Customer can download a **tax-invoice PDF** for any order from "My Orders".

### Features
- Product catalogue (categories, brands, ratings, reviews)
- Wishlist
- Cart with coupons (`DHARA10`, `PURE500`, `NEWLEAF` seeded)
- Live PIN-distance delivery quote at checkout
- UPI payment with receipt upload (image / PDF)
- Cash on Delivery
- Order tracking timeline
- Per-line-item returns with photo proof and 9-stage workflow
- Tax invoice PDF (jsPDF + autoTable)
- Email OTP signup (Gmail SMTP), email OTP login, password reset via 6-digit code
- Admin: products CRUD, orders, payment-verification queue, returns, coupons, reviews, user management (search/edit/activate/reset-pw), banners, distance-based delivery slabs, full CMS for company info + social links + policy pages
- Site-wide settings (`/api/settings`) consumed by Footer / Contact / policy pages — admin can edit branding without code changes
- SEO: dynamic `/sitemap.xml` (products + categories + static), `/robots.txt`, OpenGraph + Twitter cards

### User Roles
| Role | Permissions |
|---|---|
| **Anonymous** | Browse catalogue, search, view product details, view policy pages |
| **User** (`role: 'user'`) | Everything above + cart, checkout, wishlist, address book, place orders, raise returns, write reviews |
| **Admin** (`role: 'admin'`) | Everything above + `/admin` panel (all admin capabilities below) |

### Admin Capabilities
- Dashboard with revenue / orders / products / users KPIs + 7-day revenue & orders charts
- Products: create / edit / delete, with full specs (ingredients, benefits, usage, storage, shelf life, manufacturer, country of origin, FSSAI no., nutrition, custom specs, key features)
- Orders: list, update status (placed / payment_verification_pending / confirmed / payment_rejected / shipped / delivered / cancelled)
- Payments: review pending UPI orders, view receipt with zoom/download/full-screen, approve or reject with reason
- Users: search, edit name/email/role, activate / deactivate (blocks login), reset password, delete (cascades cart/addresses/wishlist), view per-user activity (orders + addresses)
- Coupons: create / list / delete (% off, flat ₹ off, min-order)
- Reviews: list / delete
- Returns: list all per-item returns, view photo proof, update return status / refund status / replacement status
- Delivery: edit store-PIN origin, distance slabs, free-delivery threshold, unknown-PIN fallback policy, manage PIN-code lookup table (add / bulk-import CSV / delete), test a PIN inline
- Banners: CRUD for hero slides (upload ≤1.5 MB or paste URL, reorder, active toggle, CTA text+link)
- Site Settings (CMS): edit company name / owner / address / phone / WhatsApp / email / GSTIN / FSSAI; social URLs; homepage hero copy; about-page body; contact intro; full Terms / Privacy / Shipping / Refund policy pages — with live preview

### Customer Capabilities
- Sign up with email OTP, sign in with password OR email OTP, forgot password (6-digit code via email)
- Profile (name / password change), address book
- Browse catalogue, filter & sort, wishlist
- Add to cart, apply coupon, checkout
- Saved addresses one-click apply
- Real-time delivery-quote display
- UPI / COD payment
- Order tracking page (timeline, status, items, address)
- Cancel an order (before shipping)
- Reorder an entire previous order
- Raise return request per line item (reason + description + photo/PDF)
- Download invoice PDF
- Write product reviews

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | Next.js 15.5.16 (App Router, Server Components + Client Components) on React 18.3.1 |
| **Backend framework** | Next.js API routes (catch-all `app/api/[[...path]]/route.js`) — single-file REST router |
| **Database** | MongoDB 6.x (driver `mongodb@6.6.0`) — connection cached on `globalThis._mongoClientPromise` |
| **Authentication** | Custom — Node `crypto.scrypt` password hashing + opaque session token (random uuid+uuid) stored in `sessions` collection + httpOnly cookie. NOT JWT. |
| **Email system** | `nodemailer@6.9.14` over Gmail SMTP (port 587, STARTTLS) — branded HTML templates for signup OTP, login OTP, password-reset code |
| **Payment workflow** | UPI (manual verification — customer uploads tx-id + receipt as base64 in MongoDB, admin reviews + approves/rejects) **OR** Cash on Delivery. No payment gateway integration. |
| **State management** | `swr@2.3.8` for server cache + `useState` for local UI. No Redux / Zustand. |
| **UI libraries** | shadcn/ui (Radix primitives + Tailwind), `lucide-react@0.516.0` icons, `recharts@2.15.3` charts, `framer-motion@11.18` animations, `sonner@2.0.5` toasts, `embla-carousel-react` |
| **PDF / QR** | `jspdf@4.2.1` + `jspdf-autotable@5.0.8` invoice generation; `qrcode@1.5.4` for UPI QR |
| **Styling** | Tailwind CSS 3.4.1 + `tailwindcss-animate` + custom theme tokens in `globals.css` |
| **Forms / validation** | `react-hook-form@7.58` + `zod@3.25` + `@hookform/resolvers` |
| **Build tools** | Next.js built-in webpack; ESLint via Next |
| **Package manager** | **Yarn 1.22.22** (`packageManager` field locks it). `yarn.lock` checked in. |
| **Reverse proxy (preview only)** | FastAPI `0.110` + `httpx` at `/app/backend/server.py` — used **only** in the Emergent preview pod to bypass K8s ingress routing `/api/*` to port 8001. In production (Vercel / VPS) the Next.js app handles `/api/*` directly and this proxy is not used. |

---

## 3. Complete Folder Structure

```
/app
├── DEPLOYMENT.md                   # Production deployment runbook
├── PROJECT_MASTER_DOCUMENTATION.md # THIS FILE
├── memory/
│   ├── PRD.md                      # Product requirements + delivery log
│   └── test_credentials.md         # Admin / test-user creds, SMTP creds
├── backend/                        # FastAPI reverse proxy (preview pod only)
│   ├── server.py                   # 70-line transparent proxy: 8001 → 3000
│   ├── requirements.txt            # FastAPI, httpx, pymongo etc.
│   └── .env                        # MONGO_URL, DB_NAME (legacy; kept untouched)
└── frontend/                       # ⬅ THE ACTUAL APPLICATION (Vercel-deployable)
    ├── .env                        # Server env (Mongo, SMTP, Auth secret, base URL)
    ├── .gitignore
    ├── package.json                # Deps + scripts
    ├── yarn.lock
    ├── next.config.js              # Next.js config (output: 'standalone' etc.)
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── jsconfig.json               # Path alias `@/*` → ./*
    ├── app/                        # ⬇ Next.js App Router
    │   ├── layout.js               # Root layout — metadata (OG, Twitter, canonical, favicon, themeColor)
    │   ├── globals.css             # Tailwind + design tokens
    │   ├── page.js                 # Homepage (hero slider, categories, featured / trending / new / bestseller)
    │   ├── providers.js            # SWRConfig, ThemeProvider
    │   ├── robots.js               # Dynamic robots.txt (disallow /admin /checkout /orders /cart /api)
    │   ├── sitemap.js              # Dynamic sitemap (products + categories + static)
    │   │
    │   ├── about/page.js           # About page (reads CMS 'about')
    │   ├── our-story/page.js
    │   ├── our-mission/page.js
    │   ├── why-choose-us/page.js
    │   ├── quality-promise/page.js
    │   ├── support/page.js
    │   ├── faq/page.js
    │   ├── contact/page.js         # Live contact form + ` /api/settings`
    │   │
    │   ├── login/page.js           # Password + Email-OTP tabs
    │   ├── register/page.js        # 2-step signup (form → OTP)
    │   ├── forgot-password/page.js # 6-digit reset code
    │   ├── account/page.js         # Profile + password change
    │   ├── account/addresses/page.js
    │   │
    │   ├── products/page.js        # Catalogue with filters + sort
    │   ├── products/[id]/page.js   # Product detail (tabs: details / specs / reviews) + related
    │   │
    │   ├── cart/page.js            # Cart with qty controls
    │   ├── wishlist/page.js
    │   ├── checkout/page.js        # ⚠ Critical file — address, delivery quote, UPI / COD
    │   │
    │   ├── orders/page.js          # My Orders list + invoice PDF download + return-request dialog
    │   ├── orders/[id]/page.js     # Single order view with status timeline
    │   │
    │   ├── shipping-policy/page.js # ContentPage(cmsKey="shippingPolicy")
    │   ├── return-policy/page.js
    │   ├── refund-policy/page.js   # cmsKey="refundPolicy"
    │   ├── cancellation-policy/page.js
    │   ├── privacy/page.js         # cmsKey="privacyPolicy"
    │   ├── terms/page.js           # cmsKey="termsAndConditions"
    │   │
    │   ├── admin/
    │   │   ├── page.js             # Admin shell + tabs (products / orders / payments / users / coupons / reviews / returns / delivery / banners / cms)
    │   │   ├── _cms.jsx            # CMS sub-tabs: Company Info, Social Links, Page Content
    │   │   ├── _users.jsx          # User mgmt with search + actions + activity dialog
    │   │   ├── _banners.jsx        # Banner CRUD (upload/url, reorder, active)
    │   │   └── _delivery.jsx       # Phase-8 distance-delivery admin UI
    │   │
    │   └── api/[[...path]]/route.js  # ⚠ THE WHOLE BACKEND — single 970-line catch-all
    │
    ├── components/
    │   ├── Header.jsx              # Top nav (sticky), search, dark-mode toggle, cart icon
    │   ├── HeroSlider.jsx          # Homepage carousel (embla)
    │   ├── Footer.jsx              # Footer — consumes /api/settings
    │   ├── ProductCard.jsx
    │   ├── ContentPage.jsx         # Reusable policy/static template; supports cmsKey override
    │   ├── UpiPayment.jsx          # UPI form: QR + GPay/PhonePe/Paytm deeplinks + tx-id + receipt upload
    │   ├── Providers.jsx           # Wraps providers.js
    │   └── ui/                     # shadcn primitives (50+ components)
    │
    ├── lib/
    │   ├── db.js                   # MongoClient singleton on globalThis
    │   ├── auth.js                 # hashPassword/verifyPassword (scrypt), createSession, requireUser/requireAdmin
    │   ├── email.js                # Nodemailer transport + sendOtpEmail + sendPasswordResetEmail (branded HTML)
    │   ├── company.js              # COMPANY constants (name, address, socials, contacts)
    │   ├── format.js               # inr() / inrPdf() / formatPack() / UNIT_OPTIONS
    │   ├── upi-config.js           # UPI_ID, UPI_PAYEE, buildUpiLinks()
    │   ├── seed-data.js            # CATEGORIES, BRANDS, PRODUCTS, HERO_SLIDES + SEED_VERSION constant
    │   ├── utils.js                # cn() Tailwind merge helper
    │   └── constants/testIds/      # data-testid string constants for QA
    │
    ├── hooks/
    │   ├── use-mobile.jsx
    │   └── use-toast.js
    │
    ├── public/                     # Static assets (favicon.ico, og images)
    └── tests/                      # Pytest scaffolding (mostly empty)
```

### Critical file purposes

| File | Why critical |
|---|---|
| `app/api/[[...path]]/route.js` | THE backend. 970 lines. All REST endpoints. **Do not split casually — TDZ bugs already hit us once (Phase 8). When adding helpers, declare them at module scope (above `handle()`), not inside it.** |
| `lib/auth.js` | All credentials & session logic. Touch only when wiring auth changes via the integration playbook. |
| `lib/db.js` | Mongo connection. Reads `MONGO_URL`; do not hardcode. |
| `lib/seed-data.js` | First-run catalogue seed. Bumping `SEED_VERSION` wipes products/categories/brands/coupons. |
| `app/checkout/page.js` | Customer money flow. Re-quotes delivery on PIN change. |
| `app/admin/page.js` | Admin shell. New tabs are added here. |
| `lib/company.js` + `app/api/[[...path]]/route.js → /api/settings` | Source of truth for branding (with CMS overrides). |

---

## 4. Database Documentation

MongoDB. Single database named via `DB_NAME` env (default `ecommerce`). No relational FKs — references by string `id` field (UUID or sluggable).

### Collections

| Collection | Purpose | Key fields | Indexes |
|---|---|---|---|
| `categories` | Catalogue taxonomy | `id`, `slug`, `name`, `image`, `description` | — |
| `brands` | Brand list | `id`, `slug`, `name`, `tagline`, `description` | — |
| `products` | Catalogue items | see schema below | unique on `id`, text on `name` (via $regex) |
| `users` | Customers + admins | `id`, `name`, `email`, `password`, `role`, `emailVerified`, `active`, `createdAt` | unique on `email` (logical) |
| `sessions` | Opaque auth tokens | `token`, `userId`, `createdAt`, `expiresAt` | TTL recommended on `expiresAt` |
| `addresses` | User shipping book | `id`, `userId`, `name`, `phone`, `line1`, `city`, `state`, `pincode`, `createdAt` | by `userId` |
| `carts` | One per user | `userId`, `items[]: {productId, qty}` | unique on `userId` |
| `wishlists` | One per user | `userId`, `items[]: productId` | unique on `userId` |
| `coupons` | Discount codes | `id`, `code`, `discountPct`, `discountFlat`, `minOrder`, `active`, `description` | unique on `code` |
| `orders` | Order ledger | see schema below | by `userId`, by `createdAt` desc |
| `reviews` | Product reviews | `id`, `productId`, `userId`, `userName`, `rating`, `comment`, `createdAt` | by `productId` |
| `otps` | Login OTPs | `email`, `code`, `expiresAt`, `used`, `createdAt` | TTL on `expiresAt` |
| `signup_otps` | Signup OTPs | same as `otps` | same |
| `pwresets` | Password reset codes | `email`, `token`, `expiresAt`, `used`, `createdAt` | same |
| `contact_messages` | Contact form | `id`, `name`, `email`, `phone`, `subject`, `message`, `createdAt` | — |
| `newsletter` | Subscriptions | `email`, `createdAt` | unique on `email` |
| `site_settings` | CMS data | `key: 'main'`, `value: {company, socials, content}`, `updatedAt` | unique on `key` |
| `banners` | Hero slides | `id`, `title`, `subtitle`, `image`, `link`, `cta`, `order`, `active`, `createdAt` | by `order` |
| `pincodes` | PIN→distance lookup | `pincode`, `distanceKm`, `deliverable`, `city`, `state`, `updatedAt` | unique on `pincode` |
| `delivery_settings` | Slab + threshold | `key: 'main'`, `value: {storePincode, freeDeliveryThreshold, slabs[], fallbackPolicy, notDeliverableLabel}` | unique on `key` |
| `_meta` | Seed version flag | `key: 'seedVersion'`, `value: number` | unique on `key` |

### Schemas (sample records)

**`products`**
```json
{
  "id": "p-001",
  "slug": "palm-sprout-powder-panai-vidai-",
  "name": "Palm Sprout Powder (Panai Vidai)",
  "brand": "brand-dhara",
  "category": "cat-palm-sprout",
  "price": 399,
  "mrp": 549,
  "image": "https://...",
  "images": ["https://..."],
  "description": "...",
  "ingredients": "100% Palmyra sprout",
  "benefits": "Rich in calcium...",
  "usage": "1 tsp twice daily in warm milk",
  "storage": "Store in cool, dry place",
  "shelfLife": "12 months",
  "manufacturer": "Dhara Aadhvika",
  "countryOfOrigin": "India",
  "fssaiNumber": "12345678901234",
  "nutrition": "Per 100g: Energy 380 kcal, Protein 0.4g...",
  "weight": "500",
  "unit": "Gram",
  "specs": { "Pressing method": "Wood pressed" },
  "additionalInfo": {},
  "keyFeatures": ["100% chemical-free", "Hand-pounded"],
  "stock": 50,
  "rating": 4.5,
  "ratingCount": 213,
  "isFeatured": true,
  "isTrending": true,
  "isNew": false,
  "isBestSeller": true,
  "createdAt": "2026-06-25T07:00:00Z"
}
```

**`users`**
```json
{
  "id": "uuid-v4",
  "name": "Anjali Sharma",
  "email": "user@example.com",
  "password": "<salt>:<scrypt-hex>",   // null for OTP-only accounts
  "role": "user",                       // 'user' | 'admin'
  "emailVerified": true,
  "active": true,                       // false → login blocked
  "createdAt": "2026-06-25T..."
}
```

**`orders`**
```json
{
  "id": "DAMQTC42NA3197",                 // DA + base36(ts) + 4 uuid chars
  "userId": "uuid-v4",
  "customer": { "name": "Boopathy K", "email": "..." },
  "items": [
    { "productId": "p-001", "name": "...", "image": "...", "price": 399, "qty": 1, "total": 399, "weight": "500", "unit": "Gram",
      "returnRequest": { "reason": "Damaged Product", "description": "...", "image": "data:image/...",
                         "status": "pending", "refundStatus": "not_initiated", "replacementStatus": "not_applicable",
                         "adminNote": "", "createdAt": "...", "updatedAt": "..." } }
  ],
  "address": { "name": "...", "phone": "...", "line1": "...", "city": "...", "state": "...", "pincode": "638502" },
  "subtotal": 588, "discount": 0, "tax": 29, "shipping": 0, "total": 617,
  "couponCode": null,
  "status": "placed",                     // placed | payment_verification_pending | confirmed | payment_rejected | shipped | delivered | cancelled
  "paymentMethod": "COD",                 // COD | UPI
  "paymentVerified": false,
  "paymentDetails": null,                 // {transactionId, screenshot:base64, submittedAt} for UPI
  "paymentRejectionReason": "",
  "deliveryQuote": { /* full quote object snapshot */ },
  "createdAt": "...",
  "updates": [{ "status": "placed", "at": "..." }]
}
```

**`delivery_settings.value`**
```json
{
  "storePincode": "638502",
  "freeDeliveryThreshold": 999,
  "slabs": [
    { "fromKm": 0, "toKm": 5, "charge": 30, "label": "0–5 KM" },
    { "fromKm": 5, "toKm": 10, "charge": 50, "label": "5–10 KM" },
    { "fromKm": 10, "toKm": 15, "charge": 70, "label": "10–15 KM" },
    { "fromKm": 15, "toKm": 20, "charge": 100, "label": "15–20 KM" }
  ],
  "fallbackPolicy": "block",              // 'block' | 'flat:100'
  "notDeliverableLabel": "Beyond 20 KM"
}
```

**`site_settings.value`** (CMS)
```json
{
  "company": { "name": "...", "owner": "...", "addressLine": "...", "supportEmail": "...",
               "phoneDisplay": "...", "whatsapp": "...", "gstin": "...", "fssai": "..." },
  "socials": { "instagram": "...", "facebook": "...", "youtube": "...", "twitter": "..." },
  "content": { "homeHeroTitle": "...", "homeHeroSubtitle": "...", "about": "...",
               "contactIntro": "...", "termsAndConditions": "...", "privacyPolicy": "...",
               "shippingPolicy": "...", "refundPolicy": "..." }
}
```

### Recommended indexes (apply manually in Atlas)
```js
db.products.createIndex({ id: 1 }, { unique: true });
db.products.createIndex({ name: 'text', description: 'text' });
db.users.createIndex({ email: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.signup_otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.pwresets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.pincodes.createIndex({ pincode: 1 }, { unique: true });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.coupons.createIndex({ code: 1 }, { unique: true });
```

---

## 5. API Documentation

All routes are mounted via the catch-all `/api/[[...path]]/route.js`. Requests pass through `handle(method, segments, request)`. Authentication uses an httpOnly cookie `session` (no Bearer token, no JWT). Errors return `{ "error": "<message>" }` with status 400 / 401 / 403 / 404 / 500.

> `🔒 user` = requires logged-in user, `🛡 admin` = requires admin role, `🌐` = public.

### Auth
| Method | Route | Body | Returns | Auth |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | `{requiresOtp: true, email, message}` | 🌐 |
| POST | `/api/auth/verify-signup-otp` | `{email, code}` | user object + session cookie | 🌐 |
| POST | `/api/auth/resend-signup-otp` | `{email}` | `{ok, message}` | 🌐 |
| POST | `/api/auth/login` | `{email, password}` | user object + session cookie | 🌐 |
| POST | `/api/auth/otp/send` | `{email}` | `{ok, message}` | 🌐 |
| POST | `/api/auth/otp/verify` | `{email, code}` | user object + session cookie | 🌐 |
| POST | `/api/auth/forgot` | `{email}` | `{ok, message}` | 🌐 |
| POST | `/api/auth/reset` | `{email, token, password}` | `{ok}` | 🌐 |
| POST | `/api/auth/logout` | — | `{ok}` | 🔒 |
| GET | `/api/auth/me` | — | `{user}` or `{user: null}` | 🌐 |

### Profile & Addresses (🔒 user)
| Method | Route | Body |
|---|---|---|
| PUT | `/api/profile` | `{name}` |
| POST | `/api/profile/password` | `{oldPassword, newPassword}` |
| GET | `/api/addresses` | — |
| POST | `/api/addresses` | `{name, phone, line1, city, state, pincode}` |
| DELETE | `/api/addresses/:id` | — |

### Catalogue (🌐)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/categories` | All |
| GET | `/api/brands` | All |
| GET | `/api/products?q=&category=&brand=&minPrice=&maxPrice=&minRating=&featured=1&trending=1&new=1&bestSeller=1&sort=newest|price_asc|price_desc|rating|discount&page=&limit=` | Paged |
| GET | `/api/products/:id` | Returns `{product, related, reviews}` |
| GET | `/api/hero` | Hero slides (used if no custom banners) |
| GET | `/api/banners` | Active custom banners |

### Cart (🔒 user)
| Method | Route | Body |
|---|---|---|
| GET | `/api/cart` | Returns `{items, subtotal, tax, shipping, total}` (anonymous → empty) |
| POST | `/api/cart/add` | `{productId, qty?}` |
| POST | `/api/cart/update` | `{productId, qty}` (qty=0 removes) |
| POST | `/api/cart/clear` | — |

### Wishlist (🔒 user)
| Method | Route | Body |
|---|---|---|
| GET | `/api/wishlist` | — |
| POST | `/api/wishlist/toggle` | `{productId}` → `{added: bool}` |

### Coupons
| Method | Route | Body | Auth |
|---|---|---|---|
| POST | `/api/coupons/validate` | `{code, subtotal}` | 🌐 |
| GET | `/api/admin/coupons` | — | 🛡 |
| POST | `/api/admin/coupons` | `{code, discountPct?, discountFlat?, minOrder?, description}` | 🛡 |
| DELETE | `/api/admin/coupons/:id` | — | 🛡 |

### Orders
| Method | Route | Body | Auth |
|---|---|---|---|
| POST | `/api/orders` | `{address, couponCode?, paymentMethod, paymentDetails?}` | 🔒 |
| GET | `/api/orders` | — | 🔒 |
| GET | `/api/orders/:id` | — | 🔒 (owner or admin) |
| POST | `/api/orders/:id/cancel` | — | 🔒 |
| POST | `/api/orders/:id/reorder` | — | 🔒 |
| POST | `/api/orders/:orderId/return/:productId` | `{reason, description?, image?}` | 🔒 |
| POST | `/api/checkout/quote` | `{couponCode?, pincode?}` | 🔒 |

**Example: place a COD order**
```bash
curl -X POST https://dharaaadhvika.in/api/orders \
  -H "Content-Type: application/json" -b "session=..." \
  -d '{
    "address": {"name":"Boopathy K","phone":"9384948663","line1":"40 Puthumanjalanaicanur",
                "city":"Anthiyur","state":"Tamil Nadu","pincode":"638502"},
    "paymentMethod":"COD"
  }'
```
Response (200):
```json
{"id":"DAMQTC42NA3197","status":"placed","total":785,"deliveryQuote":{...},...}
```
Rejected if PIN undeliverable (400):
```json
{"error":"Chennai is 450 km from our store — Beyond 20 KM."}
```

### Delivery (Phase 8)
| Method | Route | Body | Auth |
|---|---|---|---|
| GET | `/api/delivery/quote?pincode=&subtotal=` | — | 🌐 |
| GET | `/api/admin/delivery` | — | 🛡 |
| PUT | `/api/admin/delivery` | `{storePincode, freeDeliveryThreshold, slabs, fallbackPolicy, notDeliverableLabel}` | 🛡 |
| POST | `/api/admin/delivery/pincodes` | `{pincode, distanceKm, city?, state?, deliverable?}` OR `{items: [...]}` | 🛡 |
| DELETE | `/api/admin/delivery/pincodes/:pincode` | — | 🛡 |

### Admin
| Method | Route | Notes |
|---|---|---|
| GET | `/api/admin/stats` | KPIs + 7-day timeseries |
| GET | `/api/admin/orders` | All orders |
| GET | `/api/admin/payments` | UPI orders only |
| PUT | `/api/admin/orders/:id` | `{status}` |
| POST | `/api/admin/orders/:id/verify-payment` | `{action: 'approve'|'reject', reason?}` |
| GET | `/api/admin/users` | All users (password stripped) |
| GET | `/api/admin/users/:id/details` | `{user, orders, addresses}` |
| PUT | `/api/admin/users/:id` | `{name?, email?, role?, active?, newPassword?}` |
| DELETE | `/api/admin/users/:id` | Cascades cart/addresses/wishlist |
| POST | `/api/admin/products` | Create |
| PUT | `/api/admin/products/:id` | Update |
| DELETE | `/api/admin/products/:id` | Delete |
| GET | `/api/admin/returns` | Flattened list of all per-item returns |
| PUT | `/api/admin/returns/:orderId/:productId` | `{status?, refundStatus?, replacementStatus?, adminNote?}` |
| GET | `/api/admin/reviews` | All |
| DELETE | `/api/admin/reviews/:id` | — |
| GET / PUT | `/api/admin/settings` | CMS settings |
| GET / POST / PUT / DELETE | `/api/admin/banners[/...]` | Banner CRUD |

### Public
| Method | Route | Body | Auth |
|---|---|---|---|
| GET | `/api/settings` | — | 🌐 (returns site_settings.value) |
| POST | `/api/contact` | `{name, email, phone, subject, message}` | 🌐 |
| POST | `/api/newsletter` | `{email}` | 🌐 |
| POST | `/api/reviews` | `{productId, rating, comment}` | 🔒 |

---

## 6. Authentication Flow

**No JWT.** Sessions are opaque tokens (`uuid+uuid`) stored in the `sessions` collection. The browser receives them as an httpOnly, sameSite=lax cookie named `session`, lifetime 30 days.

### Registration (email + password + OTP)
1. `POST /api/auth/register {name, email, password}` →
   - Checks email isn't already registered.
   - Stores user with `emailVerified: false`.
   - Generates 6-digit OTP, stores in `signup_otps` (5 min TTL).
   - Calls `sendOtpEmail()` via Gmail SMTP. If SMTP is configured and send fails → returns 500.
   - Returns `{requiresOtp: true, email}`.
2. `POST /api/auth/verify-signup-otp {email, code}` →
   - Validates code & TTL, marks OTP used.
   - Sets `emailVerified: true`.
   - Issues session cookie (`createSession`).

### Login (password)
1. `POST /api/auth/login {email, password}` →
   - Looks up user, `verifyPassword(password, u.password)` (scrypt timing-safe).
   - Rejects if `!emailVerified` (403) or `active === false` (403).
   - Issues session cookie.

### Login (email OTP)
1. `POST /api/auth/otp/send {email}` → 6-digit OTP via email (10 min TTL).
2. `POST /api/auth/otp/verify {email, code}` → creates the user if they don't exist (`role: 'user'`, `emailVerified: true`, no password), or signs in an existing user. Issues session cookie.

### Forgot password
1. `POST /api/auth/forgot {email}` → 6-digit code via email (30 min TTL). Always returns `{ok: true}` (no email enumeration).
2. `POST /api/auth/reset {email, token, password}` → validates code, updates password (scrypt-hashed).

### Session middleware
- `getCurrentUser()` reads the `session` cookie, looks up `sessions.findOne({token})`, checks `expiresAt`, returns `{id, name, email, role}` or `null`.
- `requireUser()` throws `'UNAUTHORIZED'` → caught by the route handler, returns 401.
- `requireAdmin()` requires `role === 'admin'` else throws `'FORBIDDEN'` → 403.

### Logout
`POST /api/auth/logout` deletes the session row and clears the cookie.

---

## 7. Order Flow

```
                ┌─────────────┐
                │  Browse     │  /products
                │  Catalogue  │
                └──────┬──────┘
                       ▼
                ┌─────────────┐
                │ Product PDP │  /products/:id
                │ + reviews   │
                └──────┬──────┘
                       ▼ "Add to Cart"  → POST /api/cart/add
                ┌─────────────┐
                │   Cart      │  /cart (qty, remove)
                └──────┬──────┘
                       ▼ "Checkout"
                ┌────────────────────────────────────────────┐
                │ Checkout /checkout                          │
                │  ┌──────────────────────────────────────┐  │
                │  │ 1. Address form / pick saved address │  │
                │  │ 2. Pincode change → GET /api/delivery│  │
                │  │    /quote → distance + slab + charge │  │
                │  │ 3. Coupon → POST /api/coupons/validate│ │
                │  │ 4. Choose UPI or COD                 │  │
                │  └──────────────────────────────────────┘  │
                └─────────────────────┬──────────────────────┘
                                      ▼
                       ┌───────── COD ─────────┐         ┌────── UPI ──────┐
                       │ Click "Place Order"   │         │ Show QR + apps  │
                       │ POST /api/orders      │         │ + tx-id + file  │
                       │ status='placed'       │         │ POST /api/orders│
                       └───────────────────────┘         │  paymentDetails │
                                      │                   │  ='payment_…   │
                                      │                   │   verification │
                                      │                   │   _pending'    │
                                      │                   └───────┬────────┘
                                      │                           ▼
                                      │                  ┌──────────────────┐
                                      │                  │ Admin reviews    │
                                      │                  │ receipt: zoom,   │
                                      │                  │ download, dialog │
                                      │                  └─────────┬────────┘
                                      │              ┌──── approve ─────┐
                                      │              │ paymentVerified  │
                                      │              │ =true; status=   │
                                      │              │ 'confirmed'      │
                                      │              └────────┬─────────┘
                                      ▼                       ▼
                       ┌────────────────────────────────────────────┐
                       │  Admin updates status:                      │
                       │   confirmed → shipped → delivered           │
                       │  Customer cancellable until shipped.         │
                       └─────────────────────┬──────────────────────┘
                                             ▼
                            ┌────────────────────────────────┐
                            │ After delivery, customer can:  │
                            │  • Download invoice PDF        │
                            │  • Reorder (refills cart)      │
                            │  • Request return per item     │
                            │    (reason+desc+photo/PDF)     │
                            └────────────────────────────────┘
```

### Return workflow (per line item)
`pending` → `under_review` → `approved` | `rejected` → `pickup_scheduled` → `pickup_completed` → `refunded` | `replaced` → `closed`.

### Invoice PDF
Generated client-side (`app/orders/page.js → downloadInvoice()`) with `jsPDF`. Uses `"Rs."` prefix instead of `₹` because jsPDF's standard helvetica lacks the rupee glyph. Pulls company info (name, address, FSSAI, GSTIN) from `lib/company.js`.

---

## 8. Admin Panel Documentation

URL: `/admin` (requires `role === 'admin'`).

| Tab | What it does |
|---|---|
| **Dashboard** | Auto-loaded — 4 KPI cards (Revenue, Orders, Products, Users) + 7-day revenue line + 7-day orders bar |
| **Products** | Searchable table, "Add Product" dialog with: name, brand, category, price, MRP, stock, weight + unit (Kg/Gram/Litre/ml/Piece/Pack/Box/Bottle/Bag/Dozen/Bundle), image URL, description, ingredients, benefits, usage, storage, shelf-life, manufacturer, country of origin, FSSAI no., nutrition, key features, custom specs, additional info |
| **Orders** | All orders, change status via dropdown, link to detail page |
| **Payments** | UPI orders only with thumbnail; click → full-screen receipt viewer (zoom in/out for images, native iframe for PDFs) with Verify (POST `/verify-payment` action=approve) or Reject-with-reason |
| **Users** | Search by name/email; row actions: edit (name/email/role), activate/deactivate (blocks login), reset password, delete, view activity (orders + saved addresses) |
| **Coupons** | Create (code, % or flat ₹, min-order, description), list, delete |
| **Reviews** | All reviews, link to product, delete |
| **Returns** | Flattened per-item, photo viewer, dropdowns for return status / refund status / replacement status |
| **Delivery** | Store PIN, free-delivery threshold, unknown-PIN fallback policy, editable slabs, PIN-code lookup table (search / add / bulk-import / delete), test-a-PIN widget |
| **Banners** | Hero slide CRUD (upload ≤1.5 MB or URL, title, subtitle, CTA text+link, order, active toggle) |
| **Site Settings** | Sub-tabs: Company Info (name/owner/address/phone/WhatsApp/email/GSTIN/FSSAI), Social Links (Instagram/Facebook/YouTube/X), Page Content (homepage hero copy, about, contact intro, terms, privacy, shipping policy, refund policy — with live preview) |

---

## 9. Environment Variables

All env vars live in `/app/frontend/.env` (gitignored). Documented to mirror Vercel project settings.

| Variable | Required | Purpose | Example |
|---|---|---|---|
| `MONGO_URL` | ✅ | MongoDB connection string (no DB name suffix) | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `DB_NAME` | ✅ | Database name | `ecommerce` |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Public site URL — used for `<meta>` canonicals, `sitemap.xml`, OpenGraph and SMTP email links | `https://dharaaadhvika.in` |
| `AUTH_SECRET` | ✅ | Future-proofing for token signing if you migrate from opaque-token sessions (currently unused but should still be set to a strong random value) | `openssl rand -hex 32` |
| `CORS_ORIGINS` | ⛔ optional | Reserved for future API-CORS hardening | `https://dharaaadhvika.in,https://www.dharaaadhvika.in` |
| `SMTP_HOST` | ✅ for email | Gmail SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | ✅ for email | 587 (STARTTLS) or 465 (TLS) | `587` |
| `SMTP_USER` | ✅ for email | Sending Gmail address | `dharaaadhvika@gmail.com` |
| `SMTP_PASS` | ✅ for email | Gmail **app password** (16-char, no spaces or with spaces — keep as Google gave it) | `qlio mkfy affu fxlo` |
| `SMTP_FROM` | ⛔ optional | Friendly "from" address (defaults to `SMTP_USER`) | `Dhara Aadhvika <dharaaadhvika@gmail.com>` |
| `NODE_ENV` | auto | Set automatically by Vercel/Next to `production` | `production` |

> If SMTP variables are missing the app gracefully degrades — registration still works but the OTP is logged to the server console (development mode only). In production, missing SMTP = 500 on signup.

`.env` template:
```env
MONGO_URL=mongodb+srv://USER:PASS@cluster.mongodb.net
DB_NAME=ecommerce
NEXT_PUBLIC_BASE_URL=https://dharaaadhvika.in
AUTH_SECRET=replace-with-openssl-rand-hex-32
CORS_ORIGINS=https://dharaaadhvika.in,https://www.dharaaadhvika.in

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dharaaadhvika@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=dharaaadhvika@gmail.com
```

---

## 10. Build & Run Instructions

### Prerequisites
- **Node.js ≥ 18.18** (20 LTS recommended). `node -v` to check.
- **Yarn 1.22.x** — `npm i -g yarn`. Project's `packageManager` field pins it.
- **MongoDB**: either local `mongod` listening on 27017, or a free MongoDB Atlas M0 cluster.
- For sending email, a Gmail account with **2-factor auth on** and an **app password** generated at https://myaccount.google.com/apppasswords.

### Local development
```bash
cd frontend/
yarn install               # installs deps from yarn.lock
cp .env.example .env       # then edit with your Mongo + SMTP creds
yarn dev:hot               # hot-reload dev server, port 3000
# OR
yarn build && yarn start   # production-like
```

Open http://localhost:3000.

> The script `yarn dev` builds first then `next start` (used in container). For local hot-reload prefer `yarn dev:hot`.

### First-run seeding
On the first hit to any API route, `ensureSeeded()` populates: 8 categories, 4 brands, 30 products, 3 coupons, default admin `admin@dhara.com` / `admin123`, demo user `user@dhara.com` / `user123`, 8 nearby PIN codes around 638502. The seed only runs once — the `_meta.seedVersion` doc prevents re-runs. Bumping `SEED_VERSION` in `lib/seed-data.js` forces a reseed which **deletes existing products/categories/brands/coupons** (other collections are preserved).

---

## 11. Deployment Guide

### A. Vercel (recommended)
1. Push the repo to GitHub (use Emergent's "Save to GitHub" button).
2. https://vercel.com → "Add New Project" → import the repo.
3. **Settings:**
   - Framework: Next.js (auto)
   - Root Directory: `frontend/`
   - Build Command: `yarn build` (or leave default)
   - Output Directory: `.next` (default)
   - Install Command: `yarn install`
   - Node version: 20.x
4. **Environment Variables** — add every var from section 9, scoped to **Production** + **Preview** + **Development** as needed.
5. **Deploy**. First build ≈ 3 minutes. You get `https://<project>.vercel.app`.
6. Project → Settings → Domains → add `dharaaadhvika.in` and `www.dharaaadhvika.in`. Vercel issues the DNS records — see section 12.

### B. Netlify
1. Push to GitHub.
2. https://app.netlify.com → "Import from Git".
3. Build settings: Base directory `frontend`, Build command `yarn build`, Publish directory `frontend/.next`.
4. Install Netlify's Next.js plugin (`@netlify/plugin-nextjs`) — Netlify suggests it automatically.
5. Environment variables: same as section 9.
6. Domain → Add custom domain → follow Netlify's CNAME/A record instructions.

### C. Railway
1. https://railway.app → "Deploy from GitHub repo".
2. Select repo → choose `frontend` as service root.
3. Build: `yarn build`, Start: `yarn start`, expose port `3000`.
4. Add env vars. Add a Railway MongoDB plugin **or** point `MONGO_URL` to Atlas.
5. Generate a Railway domain or add a custom domain (CNAME to `<project>.up.railway.app`).

### D. Render
1. https://render.com → New Web Service → connect repo.
2. Environment: Node. Root Directory: `frontend`. Build: `yarn install && yarn build`. Start: `yarn start`.
3. Region close to your customers (Singapore for India).
4. Env vars same as section 9.
5. Add a Render MongoDB (paid) or Atlas.

### E. VPS (Ubuntu 22.04, Hetzner/DigitalOcean)
```bash
# Install Node 20 + yarn + nginx + certbot
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo npm i -g yarn pm2

# Pull code
git clone <repo> /opt/dhara
cd /opt/dhara/frontend
cp .env.example .env && nano .env   # edit
yarn install
yarn build

# Run with PM2
pm2 start "yarn start" --name dhara-aadhvika --time
pm2 save && pm2 startup
```
Nginx config at `/etc/nginx/sites-available/dharaaadhvika.in`:
```nginx
server {
  listen 443 ssl http2;
  server_name dharaaadhvika.in www.dharaaadhvika.in;
  ssl_certificate     /etc/letsencrypt/live/dharaaadhvika.in/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/dharaaadhvika.in/privkey.pem;
  client_max_body_size 4M;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server { listen 80; server_name dharaaadhvika.in www.dharaaadhvika.in; return 301 https://$host$request_uri; }
```
SSL: `sudo certbot --nginx -d dharaaadhvika.in -d www.dharaaadhvika.in`.

### F. Docker
```dockerfile
# Dockerfile in repo root
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ .
RUN yarn build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 3000
CMD ["yarn","start"]
```
Build & run:
```bash
docker build -t dhara .
docker run -d --env-file frontend/.env -p 3000:3000 --name dhara dhara
```
Behind any reverse proxy / CDN, set the env vars and ship.

---

## 12. Domain Connection Guide

Domain: **dharaaadhvika.in** (Indian TLD — registrar likely BigRock, GoDaddy, Hostinger, etc.).

### Vercel records

**Apex (`dharaaadhvika.in`):**
| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `76.76.21.21` | 3600 |

**www subdomain:**
| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |

If your registrar supports apex CNAMEs (Cloudflare does, most don't), use a CNAME flattened to `cname.vercel-dns.com` for the apex too.

### Steps
1. In Vercel: Project → Settings → Domains → Add `dharaaadhvika.in` AND `www.dharaaadhvika.in`. Vercel shows the exact records.
2. In your registrar's DNS manager: delete any existing A or CNAME on `@` and `www`. Add the records above.
3. SSL is automatic on Vercel — wait 5–60 minutes for DNS propagation + SSL provisioning. https://www.whatsmydns.net/ helps verify.
4. Verify HTTPS: `curl -I https://dharaaadhvika.in` returns 200.

### Cloudflare in front (optional, recommended)
- Add the domain to Cloudflare → change nameservers at registrar.
- SSL mode: **Full (strict)**.
- "Always Use HTTPS": ON.
- Caching: default. Page rule to bypass cache for `/api/*` and `/admin/*`.

---

## 13. Third-Party Services

| Service | Purpose | Plan | Notes |
|---|---|---|---|
| **MongoDB Atlas** | Database | M0 free → M10 paid for prod | Whitelist `0.0.0.0/0` for Vercel. Backups: continuous PITR on M10+. |
| **Gmail SMTP** | OTP + password-reset emails | Free (500 emails/day, hard limit) | Requires 2FA + app password. For scale > 500/day migrate to SendGrid / Brevo. |
| **Vercel** | Hosting | Hobby = free | Auto SSL, edge CDN, serverless functions for API routes. |
| **Cloudflare** (optional) | DNS, CDN, WAF | Free | Recommended in front of Vercel for caching static assets. |
| **emergentintegrations** | LLM integrations | N/A | Was used during dev but NOT in runtime. Safe to remove from prod. |
| **No payment gateway** | — | — | UPI is manual verification. To add Razorpay/Stripe/PhonePe Business → see section 17. |

There are **no other paid third-party SDKs** in the runtime. No Google Maps, no Sentry, no Algolia, no Shippo.

---

## 14. Security Documentation

### Strengths
- Passwords hashed with **scrypt** (Node `crypto.scryptSync`) + 16-byte random salt + `timingSafeEqual` compare. No bcrypt config needed.
- Sessions = **opaque random tokens** (not JWT) — server-side revocable, can't be tampered.
- Cookies: `httpOnly`, `sameSite=lax`, `path=/`. Set `secure: true` automatically in production (Vercel terminates TLS).
- Admin endpoints behind `requireAdmin()` which throws `'FORBIDDEN'` → 403.
- Deactivated users (`active === false`) blocked from login (password + OTP paths).
- Forgot-password returns `{ok}` even when email isn't registered (no enumeration).
- OTP TTLs: signup 5 min, login 10 min, reset 30 min. One-time-use flag (`used: true`).
- `robots.txt` disallows `/admin`, `/checkout`, `/orders`, `/cart`, `/api`.
- Receipt uploads capped at 2 MB; banner uploads at 1.5 MB.

### Known weaknesses / TODO
| Area | Risk | Mitigation |
|---|---|---|
| No rate limiting on `/api/auth/login`, `/api/auth/otp/send`, `/api/auth/forgot` | Credential stuffing / OTP spam | Add a simple Mongo-based limiter (track failed attempts per IP+email in last N min) |
| Receipt screenshots stored as base64 in MongoDB | DB bloat at scale | Migrate to S3 / Cloudflare R2 |
| `AUTH_SECRET` defined but unused | Confusing | Either start signing session tokens or remove the var from docs |
| CSRF — no double-submit token | Form CSRF possible via cross-site | sameSite=lax mitigates most flows; full CSRF token recommended before scaling |
| No 2FA for admin | Admin takeover via leaked password | Wire up TOTP via `otplib` |
| Receipt files are base64 in JSON responses to admin | Huge payloads | Stream from S3 instead |
| Mongo connection uses `MONGO_URL` with embedded creds | Standard for Atlas — keep `.env` private | Use `MONGODB_X509` for stronger auth on M10+ |

### Secrets handling
- Never commit `.env`. It's gitignored.
- In Vercel/Netlify/Railway, set every secret in the dashboard. Avoid `NEXT_PUBLIC_*` prefix for anything secret — `NEXT_PUBLIC_BASE_URL` is the only one that ships to the browser.
- Rotate `SMTP_PASS` if exposed (revoke the Google app password and generate a new one).
- Rotate the admin password immediately after first deploy.

---

## 15. Error Troubleshooting Guide

### Build failed
- **Cause**: TS/ESLint error, missing dep. **Fix**: read the build log, run `yarn lint`, `yarn build` locally to reproduce. Common ones: unescaped `'` / `"` in JSX (use `&apos;`, `&ldquo;`).

### MongoDB connection failed
- **Symptoms**: `MongoServerSelectionError`, hanging API requests.
- **Causes**:
  - `MONGO_URL` not set or wrong.
  - Atlas IP not whitelisted (Vercel functions use rotating IPs → whitelist `0.0.0.0/0`).
  - Atlas user has wrong role (needs `readWrite` on the DB).
- **Fix**: `mongosh "$MONGO_URL"` from your laptop to confirm credentials work.

### Login failed
- "invalid credentials" → password wrong OR user doesn't exist.
- "Please verify your email before logging in" → user signed up but didn't complete OTP step. Resend via `/api/auth/resend-signup-otp`.
- "Your account has been deactivated" → admin set `active: false`. Reactivate in admin Users tab.

### OTP failed
- "invalid or expired code" → wrong code OR TTL expired (5/10/30 min depending on flow). Resend.
- "Could not send verification email" → SMTP credentials wrong. Verify with `swaks -t test@gmail.com -s smtp.gmail.com -p 587 -tls -au $SMTP_USER -ap "$SMTP_PASS"`.

### Payment upload failed
- "File must be under 2 MB" → user is uploading a huge image. Compress.
- "Only JPG, PNG or PDF accepted" → MIME type mismatch. Check `file.type`.

### Place Order failed
- **"Sorry, we cannot deliver to this PIN code"** → PIN not in `pincodes` collection OR `deliverable: false` OR beyond all slabs. Admin must add the PIN with `distanceKm` ≤ 20 in Admin → Delivery.
- **"UPI transaction ID and screenshot required"** → user clicked submit without filling both. Frontend already validates; backend re-checks.
- **"cart empty"** → cart was cleared between checkout-load and submit. Refresh.
- **`Cannot access 'f' before initialization`** → TDZ inside `route.js`. **HISTORICAL BUG, FIXED.** If it returns, you've reintroduced a `const` reference inside `handle()` that's defined later in the function. Fix by hoisting the declaration **above** `handle()` to module scope. (We hit this in Phase 8 when `DEFAULT_DELIVERY`, `getDeliverySettings`, `quoteDelivery` were declared inside `handle()` below the `/orders` POST branch.)

### Environment variable missing
- Symptoms vary: MongoDB hang, blank email, broken SMTP. Add it in Vercel project settings → Environment Variables → redeploy.

### API route error / 500
- Tail Vercel function logs (Project → Deployments → Functions). Common causes: Mongo down, SMTP rate-limited, base64 image too big (Vercel 4.5 MB body limit).

### Deployment failed
- **Build OOM** → set `NODE_OPTIONS=--max-old-space-size=2048` in Vercel.
- **"output: standalone" warning** → harmless on Vercel; only relevant for bare `next start`.
- **Function timeout** → Vercel functions have 10 s default on Hobby. Bulk-import pincodes for 100k rows will time out. Switch to API streaming or move heavy import to a worker.

### Hot-reload not working
- Use `yarn dev:hot` (not `yarn dev` which does a static build first).

### `'next start' does not work with 'output: standalone' configuration`
- Harmless warning. Just a notice. Next.js still serves successfully. Or remove `output: 'standalone'` from `next.config.js` if you don't need it.

---

## 16. Maintenance Guide

### Adding products
- Admin → Products → "Add Product". Fill all fields. Save. Live immediately.
- Bulk: not yet supported via UI. Use `mongoimport` against the `products` collection (preserve `id`, `slug` uniqueness).

### Changing logo
- Replace `/app/frontend/public/favicon.ico`.
- For the header text-logo, edit `components/Header.jsx` (it's text + a leaf icon, no image asset).

### Changing content
- Admin → Site Settings → Page Content → edit any of: homepage hero title/subtitle, about copy, contact intro, terms, privacy, shipping, refund. Click "Preview" to verify. Save. Changes are instant on the public pages (which fetch `/api/settings`).

### Changing domain
1. Add the new domain in Vercel Domains.
2. Update DNS records.
3. Update `NEXT_PUBLIC_BASE_URL` env var (sitemap + email links use it).
4. Redeploy.

### Changing SMTP (e.g. move to SendGrid)
1. Update `.env`:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=<sendgrid api key>
   ```
2. Redeploy. No code change required — `lib/email.js` is generic SMTP.

### Updating dependencies
```bash
cd frontend
yarn upgrade-interactive --latest   # pick what you want to bump
yarn build                          # confirm no breakage
yarn lint
```
Critical pins:
- `next@15.5.x` (15.x is App-Router stable)
- `react@18.3.x` (do NOT jump to 19 without testing — Radix UI compat varies)
- `mongodb@6.6.x` (driver 7 has breaking changes around `ObjectId`)

### Backing up the database
Atlas: enable continuous backups. Or manually:
```bash
mongodump --uri="$MONGO_URL/$DB_NAME" --out=./backups/$(date +%F)
```

---

## 17. Future Improvements

Already drafted in PRD (see `/app/memory/PRD.md`). Priority order:

| Priority | Feature | Effort |
|---|---|---|
| P0 | **Customer Ledger** (Phase 4) — opening balance, orders, payments, refunds, returns; date filter; PDF + Excel export | medium |
| P0 | **Quotation system** (Phase 5) — admin creates quotation → email/PDF → customer accepts → converts to order | medium |
| P0 | **GST Tax Invoice** (Phase 6) — HSN code, CGST/SGST/IGST split, QR code, real GSTIN/FSSAI; needs Boopathy's real GSTIN | medium |
| P1 | **Reviews moderation queue** (Phase 9) — pending state, admin approves/rejects | small |
| P1 | **Low-stock alerts** (Phase 9) — dashboard widget + email to admin when stock < 10 | small |
| P1 | **Sales / GST reports** (Phase 9) — monthly revenue, top sellers, GST collected | medium |
| P1 | **Search analytics** (Phase 9) — log search queries with no results | small |
| P1 | **Payment gateway** — Razorpay or PhonePe Business to remove manual UPI verification | medium |
| P2 | **Image storage** — migrate banner + payment receipt from base64-in-Mongo to S3 / Cloudflare R2 | medium |
| P2 | **WhatsApp order notifications** — auto-ping admin's WhatsApp on every new order via wa.me link | small |
| P2 | **Rich-text CMS editor** — replace plain textarea with Tiptap | small |
| P2 | **Rate limiting** — auth endpoints | small |
| P2 | **2FA for admin** | small |
| P2 | **Real Distance Matrix API** — switch from PIN lookup to Google Maps API for any-PIN delivery quoting | small |
| P3 | **Order tracking via courier APIs** — Shiprocket / Delhivery integration | medium |
| P3 | **SMS notifications** — Twilio / MSG91 for delivery updates | small |
| P3 | **Multi-language** (Tamil + English) | medium |
| P3 | **Subscription / repeat orders** | large |

---

## 18. AI Handover Section

> Optimized for Claude, ChatGPT, Gemini, Cursor, OpenCode, GitHub Copilot.

### Architecture in one paragraph
This is a **single-process Next.js 15 app**: the App Router serves both the storefront (RSC + client components) and the entire REST API (a single catch-all `app/api/[[...path]]/route.js`). Storage is **MongoDB** accessed via the official driver, cached on `globalThis._mongoClientPromise`. Auth is **opaque cookie sessions** (no JWT). Email goes through **nodemailer + Gmail SMTP**. There is **no separate backend service** — the `app/backend/server.py` FastAPI proxy only existed in the Emergent preview pod to bypass K8s `/api/*` routing and is irrelevant for Vercel/VPS deployment.

### Critical files (read these first)
1. `app/api/[[...path]]/route.js` — 970-line monolithic API. Open and `Ctrl-F` for the route prefix you care about (e.g. `'/orders'`).
2. `lib/db.js` (24 lines) — Mongo singleton.
3. `lib/auth.js` (72 lines) — passwords + sessions.
4. `lib/seed-data.js` — catalogue seed; bump `SEED_VERSION` to force reseed (destructive).
5. `app/checkout/page.js` — the money flow on the client.
6. `app/admin/page.js` + `app/admin/_*.jsx` — the entire admin UI.
7. `lib/company.js` — branding source of truth (CMS overrides at runtime via `/api/settings`).

### Dependency summary
- React 18, Next 15, Tailwind 3, MongoDB driver 6, nodemailer 6, jspdf 4 + autotable 5, qrcode 1.5, swr 2, react-hook-form 7, zod 3, recharts 2, lucide-react, radix-ui/*, sonner. **Yarn 1.22.x** lock.

### Startup sequence
1. `yarn install` (Yarn 1 with `yarn.lock`).
2. Set `.env` from section 9.
3. Ensure MongoDB is reachable (`mongosh "$MONGO_URL"` works).
4. `yarn build && yarn start` — listens on `:3000`.
5. First HTTP request triggers `ensureSeeded()` → creates catalogue + default admin + 8 PIN codes.
6. Log in as `admin@dhara.com` / `admin123` → change password from the admin Users tab.

### Deployment sequence
1. Push to GitHub.
2. Vercel → import repo → root dir `frontend/` → add env vars (section 9) → Deploy.
3. Vercel Domains → add `dharaaadhvika.in` and `www.dharaaadhvika.in`.
4. Registrar DNS → add A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`. Wait 5–60 min.
5. Verify: `curl -I https://dharaaadhvika.in` returns 200. Then log into `/admin`, change admin password, delete `user@dhara.com`, edit Site Settings.

### Debugging sequence
1. Read the **server-side** error first — most "Place Order failed" symptoms originate as 4xx/5xx from `/api/orders`. The frontend toast just re-displays the API's `error` field.
2. Look at the Vercel function log (or `pm2 logs` on VPS) for the stack trace.
3. If the trace points into the minified `route.js` with single-letter names, the real culprit is usually a **TDZ** — search the source for the most recently added top-level helper inside `handle()` and hoist it to module scope.
4. To reproduce production-minified behavior locally, use `yarn build && yarn start`, never `yarn dev:hot` — many TDZ bugs only appear after minification.
5. Browser console errors are usually about hooks ordering. The rule: **all hooks must run before any conditional `return`**.

### Conventions an AI editor must follow
- **`data-testid` everywhere** on interactive elements. Keep them stable.
- **No JWT, no Bearer headers.** Sessions are cookie-only. Add new auth flows via `createSession()` / `destroySession()` in `lib/auth.js`.
- **MongoDB ids are strings** (UUID v4 or sluggable). `_id` is stripped before returning JSON (`const { _id, ...r } = doc`).
- **Datetime**: store native `Date` in Mongo, send ISO 8601 strings to the client.
- **Currency rendering**: on screen use `inr()` from `lib/format.js` (₹ unicode). In PDFs use `inrPdf()` (`Rs.` prefix, jsPDF lacks the rupee glyph).
- **Adding API routes**: declare top-level helpers ABOVE `handle()` to avoid TDZ. Inside `handle()`, use simple `if (path === '...') { ... }` blocks following the existing style.
- **CMS**: any new policy page should accept `cmsKey="..."` and render the override from `/api/settings.content.<key>` if set.
- **Do not edit `lib/company.js` defaults**. Override via the CMS instead, so admin can change later.
- **Do not edit `next.config.js`** unless you know why (`output: 'standalone'` is intentional for Docker; on Vercel it's ignored).

### What this app deliberately does NOT have (yet)
- No payment gateway (UPI is manual)
- No real distance API (PIN lookup table only)
- No Sentry / Datadog / GA4 (add yourself)
- No queue worker (everything sync in API routes)
- No image CDN (raw URLs / base64)
- No CSRF tokens (relies on sameSite=lax cookies)
- No GraphQL (REST only via catch-all)
- No microservices (deliberately one process)

### Quick-start tasks for new AIs
1. **"Add a coupon"** → POST `/api/admin/coupons` from the Admin → Coupons tab (or directly via curl). Already works.
2. **"Change the brand colour"** → edit `app/globals.css` (Tailwind theme variables) — but check first that `tailwind.config.js` doesn't override.
3. **"Add a product field"** → 4 places to update: (a) seed in `lib/seed-data.js` if applicable, (b) admin product form in `app/admin/page.js`, (c) product detail page `app/products/[id]/page.js`, (d) optionally the invoice generator in `app/orders/page.js`.
4. **"Make the API return ObjectId"** → don't. Always strip with `const { _id, ...r } = doc`.
5. **"Add an admin tab"** → create `app/admin/_yourtab.jsx`, import it in `app/admin/page.js`, add to `<TabsList>` and `<TabsContent>`.

---

**End of PROJECT_MASTER_DOCUMENTATION.md.** For per-feature deployment specifics also see `/app/DEPLOYMENT.md`. For active task tracking see `/app/memory/PRD.md`. For credentials in non-production environments see `/app/memory/test_credentials.md`.

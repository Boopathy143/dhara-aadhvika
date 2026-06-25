# ARCHITECTURE_DIAGRAMS.md

ASCII diagrams of every major flow in **Dhara Aadhvika**. Use these to reason about the system before changing anything.

---

## 1. System architecture (production on Vercel)

```
                    ┌──────────────────────────┐
                    │      End user (browser)  │
                    │   https://dharaaadhvika.in│
                    └─────────────┬────────────┘
                                  │ HTTPS
                                  ▼
                    ┌──────────────────────────┐
                    │  Cloudflare (optional)   │  CDN, WAF, edge SSL
                    └─────────────┬────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │  Vercel Edge / Functions │  Auto SSL, global CDN
                    │  Region: closest to user │
                    └─────────────┬────────────┘
                                  ▼
                    ┌──────────────────────────────────────────────┐
                    │           Next.js 15 (single process)        │
                    │                                              │
                    │   /                  /products/[id]          │
                    │   /products          /cart  /wishlist        │
                    │   /checkout          /orders /orders/[id]    │
                    │   /login /register   /admin/*                │
                    │   /sitemap.xml       /robots.txt             │
                    │                                              │
                    │   /api/[[...path]]/route.js  (REST router)   │
                    │   ├── /api/auth/*        (10 endpoints)      │
                    │   ├── /api/products...                       │
                    │   ├── /api/cart/* /api/wishlist/*            │
                    │   ├── /api/orders   /api/checkout/quote      │
                    │   ├── /api/delivery/quote                    │
                    │   ├── /api/settings  /api/banners            │
                    │   └── /api/admin/*       (all behind auth)   │
                    └─────────────┬────────────┬─────────────┬─────┘
                                  │            │             │
                                  ▼            ▼             ▼
                       ┌────────────────┐ ┌──────────┐ ┌─────────────┐
                       │ MongoDB Atlas  │ │ Gmail    │ │ External    │
                       │ (M0 → M10)     │ │  SMTP    │ │ image hosts │
                       │ 21 collections │ │ (OTP+    │ │ (Unsplash,  │
                       │                │ │  reset)  │ │  Cloudinary)│
                       └────────────────┘ └──────────┘ └─────────────┘
```

In Emergent preview pod ONLY, there's a small FastAPI proxy at port 8001 that forwards to Next.js on 3000 (K8s ingress routes `/api/*` to 8001). It's NOT part of the production deployment.

---

## 2. Authentication flow

```
SIGN-UP (email + password + OTP)

   Browser                       Next.js API                MongoDB              Gmail SMTP
      │                                │                       │                     │
      │  POST /api/auth/register       │                       │                     │
      │   {name, email, password}      │                       │                     │
      ├───────────────────────────────►│                       │                     │
      │                                │  insert(users)        │                     │
      │                                │   {emailVerified:false}│                    │
      │                                ├──────────────────────►│                     │
      │                                │                       │                     │
      │                                │  insert(signup_otps)  │                     │
      │                                │   {code, expires:5m}  │                     │
      │                                ├──────────────────────►│                     │
      │                                │                       │                     │
      │                                │  sendOtpEmail()       │                     │
      │                                ├─────────────────────────────────────────────►│
      │  200 {requiresOtp:true}        │                       │       6-digit OTP   │
      │◄───────────────────────────────│                       │      delivered      │
      │                                                                              ▼
      │  user reads OTP from inbox                                       inbox: dharaaadhvika@gmail.com
      │
      │  POST /api/auth/verify-signup-otp {email, code}
      ├───────────────────────────────►│
      │                                │  validate, mark used
      │                                │  update(users): emailVerified=true
      │                                │  insert(sessions): {token, expires:30d}
      │                                │  Set-Cookie: session=<token>
      │  200 + Set-Cookie              │
      │◄───────────────────────────────│


PASSWORD LOGIN

   Browser                       Next.js API                MongoDB
      │  POST /api/auth/login          │                       │
      │   {email, password}            │                       │
      ├───────────────────────────────►│                       │
      │                                │  findOne(users)       │
      │                                ├──────────────────────►│
      │                                │ verifyPassword(scrypt)│
      │                                │ if !emailVerified→403 │
      │                                │ if active===false→403 │
      │                                │ createSession()       │
      │                                ├──────────────────────►│
      │  200 + Set-Cookie              │
      │◄───────────────────────────────│


SESSION CHECK (every authenticated request)

   Cookie: session=<opaque>
      │
      ▼
   getCurrentUser()  →  sessions.findOne({token})
      │                       │
      │                       └─ if expired → return null
      ▼
   users.findOne({id: session.userId})
      │
      ▼
   return {id, name, email, role}
```

No JWT. No Bearer headers. Pure cookie + DB-backed sessions, revocable.

---

## 3. Order flow (checkout + payment)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                CHECKOUT                                       │
└──────────────────────────────────────────────────────────────────────────────┘

  User on /checkout
      │
      │  fills address fields
      │  enters 6-digit pincode
      │
      ▼ pincode change triggers useEffect ──► GET /api/delivery/quote?pincode=&subtotal=
                                                       │
                                                       ▼
                                               quoteDelivery():
                                                pincodes.findOne(pincode)
                                                +
                                                delivery_settings.value
                                                ─► determine slab + charge
                                                   OR { deliverable: false }
                                                       │
                                                       ▼
                                  ┌───────── deliverable ─────────┐
                                  │ {slab, charge, distanceKm,    │
                                  │  free?, message}              │
                                  └───────────────┬───────────────┘
                                                  ▼
                                       UI shows green banner
                                       "Delivering to <city> • <km> km"
                                       "₹<charge> delivery" / "FREE"

                                  ┌───────── NOT deliverable ─────┐
                                  │ {deliverable:false, message}  │
                                  └───────────────┬───────────────┘
                                                  ▼
                                       UI shows red banner
                                       Place Order buttons DISABLED


┌──────────────────────────────────────────────────────────────────────────────┐
│                             COD PATH                                          │
└──────────────────────────────────────────────────────────────────────────────┘

  User clicks "Place Order (COD)"
      │
      ▼ POST /api/orders
          { address, paymentMethod:'COD', couponCode? }
      │
      ▼ on server:
          - validate cart non-empty
          - re-compute subtotal, discount, tax (5%)
          - call quoteDelivery() AGAIN  ──► reject 400 if undeliverable
          - generate orderId "DA" + base36(ts) + 4 uuid chars
          - insert(orders) status='placed'
          - empty(carts)
      │
      ▼ 200 {id, total, status:'placed', deliveryQuote}
      │
      ▼ UI shows "Order Confirmed!" + downloadable invoice


┌──────────────────────────────────────────────────────────────────────────────┐
│                             UPI PATH                                          │
└──────────────────────────────────────────────────────────────────────────────┘

  User clicks "Pay with UPI" tab
      │
      ▼ shows QR (qrcode lib) + GPay/PhonePe/Paytm deeplinks
      │
      ▼ user pays in their UPI app, comes back
      │
      ▼ enters tx-id (≥6 chars), uploads receipt (JPG/PNG/PDF ≤2 MB)
      │
      ▼ clicks "I have paid — Submit"
      │
      ▼ POST /api/orders
          { address, paymentMethod:'UPI',
            paymentDetails: {transactionId, screenshot:base64} }
      │
      ▼ on server:
          - same validations as COD
          - status='payment_verification_pending'
          - paymentVerified=false
          - insert(orders) with paymentDetails embedded
      │
      ▼ 200 {id, status:'payment_verification_pending'}
      │
      ▼ UI shows "Order Confirmed! Awaiting payment verification"


┌──────────────────────────────────────────────────────────────────────────────┐
│                       ADMIN VERIFIES UPI ORDER                                │
└──────────────────────────────────────────────────────────────────────────────┘

  Admin opens /admin → Payments tab
      │
      ▼ sees pending UPI orders with receipt thumbnails
      │
      ▼ clicks thumbnail → full-screen viewer (zoom for img, iframe for PDF)
      │
      ▼ clicks Verify  OR  Reject (with reason)
      │
      ▼ POST /api/admin/orders/:id/verify-payment {action, reason?}
      │
      ▼ on approve: paymentVerified=true, status='confirmed'
        on reject : paymentVerified=false, status='payment_rejected',
                    paymentRejectionReason=<reason>
      │
      ▼ Customer sees status change in /orders


┌──────────────────────────────────────────────────────────────────────────────┐
│                          FULFILLMENT TIMELINE                                 │
└──────────────────────────────────────────────────────────────────────────────┘

  placed ──► confirmed ──► shipped ──► delivered
    │           │              │           │
    │           │              │           └─► customer can:
    │           │              │                 - download invoice
    │           │              │                 - reorder
    │           │              │                 - raise return per item
    │           │              │
    │           │              └─► customer can cancel (until shipped)
    │           │
    │           └─► UPI orders enter here after admin approval
    │
    └─► payment_verification_pending (UPI)
          │
          └─► payment_rejected if admin rejects
```

---

## 4. Return workflow (per line item)

```
delivered order
    │
    ▼ customer clicks "Request Return" on a line item
    │
    ▼ fills:
        - reason (Damaged/Wrong/Expired/Quality/Missing/Other)
        - description
        - photo or PDF proof (≤2 MB)
    │
    ▼ POST /api/orders/:orderId/return/:productId
    │
    ▼ stored as items.$.returnRequest = { reason, description, image,
                                            status:'pending', refundStatus:'not_initiated',
                                            replacementStatus:'not_applicable', createdAt }
    │
    ▼
                       ┌────────── admin reviews ──────────┐
                       │ /admin → Returns tab              │
                       │ views photo, reads reason         │
                       │ moves status forward via dropdown │
                       └────────────────┬──────────────────┘
                                        │
       ┌────────────────────────────────┼────────────────────────────────┐
       ▼                                ▼                                ▼
   pending                       under_review                      rejected
                                        │
                                  approved
                                        │
                                  pickup_scheduled
                                        │
                                  pickup_completed
                                        │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
                   refunded                          replaced
                       │                                 │
                       └────────────┬────────────────────┘
                                    ▼
                                  closed
```

Refund status moves in parallel: `not_initiated → processing → refunded`.
Replacement status moves in parallel: `not_applicable → pending → dispatched → delivered`.

---

## 5. Admin flow (10 tabs)

```
/admin (requireAdmin)
   │
   ├── Dashboard (default)
   │   ├── KPI cards: Revenue, Orders, Products, Users  (GET /api/admin/stats)
   │   └── 7-day Revenue line + 7-day Orders bar (recharts)
   │
   ├── Products
   │   ├── List (GET /api/products?limit=48)
   │   ├── Add (POST /api/admin/products) — dialog with 24 fields
   │   ├── Edit (PUT /api/admin/products/:id)
   │   └── Delete (DELETE /api/admin/products/:id)
   │
   ├── Orders
   │   ├── List (GET /api/admin/orders)
   │   ├── Status dropdown (PUT /api/admin/orders/:id {status})
   │   └── Link to /orders/:id
   │
   ├── Payments (UPI only)                            ◄─── PENDING badge
   │   ├── List (GET /api/admin/payments)
   │   ├── Receipt viewer with zoom + download
   │   └── Approve / Reject (POST /api/admin/orders/:id/verify-payment)
   │
   ├── Users
   │   ├── Search (GET /api/admin/users)
   │   ├── Edit (PUT /api/admin/users/:id {name, email, role})
   │   ├── Reset password (PUT /api/admin/users/:id {newPassword})
   │   ├── Activate/Deactivate (PUT /api/admin/users/:id {active})
   │   ├── Delete (DELETE /api/admin/users/:id)
   │   └── Activity (GET /api/admin/users/:id/details) — orders + addresses
   │
   ├── Coupons
   │   ├── List (GET /api/admin/coupons)
   │   ├── Create (POST /api/admin/coupons)
   │   └── Delete (DELETE /api/admin/coupons/:id)
   │
   ├── Reviews
   │   ├── List (GET /api/admin/reviews)
   │   └── Delete (DELETE /api/admin/reviews/:id)
   │
   ├── Returns                                        ◄─── COUNT badge
   │   ├── List flattened per-item (GET /api/admin/returns)
   │   ├── Photo viewer
   │   └── Status dropdowns (PUT /api/admin/returns/:orderId/:productId)
   │
   ├── Delivery                                       ── Phase 8
   │   ├── Store PIN + Free Threshold + Fallback policy
   │   ├── Editable slab list
   │   ├── PIN-code table (search + add + bulk-CSV-import + delete)
   │   └── Test-a-PIN widget
   │
   ├── Banners
   │   ├── List (GET /api/admin/banners)
   │   ├── Create/Edit (POST/PUT /api/admin/banners[/:id])
   │   ├── Upload (≤1.5 MB) or URL
   │   └── Reorder / Active toggle
   │
   └── Site Settings (CMS)
       ├── Company Info (name, owner, address, phone, WhatsApp, email, GSTIN, FSSAI)
       ├── Social Links (Instagram, Facebook, YouTube, X)
       └── Page Content (homepage hero, about, contact intro, terms, privacy, shipping, refund)
            └── Save → PUT /api/admin/settings → public pages re-fetch /api/settings
```

---

## 6. Database relations (logical)

```
                        ┌──────────────┐
                        │   USERS      │ id (UUID)
                        │              │ email
                        │              │ role  ('user'|'admin')
                        │              │ active
                        └──────┬───────┘
                               │
        ┌──────────────────────┼──────────────────────┬───────────────┐
        ▼                      ▼                      ▼               ▼
  ┌───────────┐         ┌───────────┐          ┌────────────┐  ┌──────────────┐
  │ ADDRESSES │         │ SESSIONS  │          │ CARTS      │  │ WISHLISTS    │
  │ userId    │         │ token     │          │ userId     │  │ userId       │
  └───────────┘         │ userId    │          │ items[]    │  │ items[]      │
                        └───────────┘          │ {prodId,   │  │ [productId]  │
                                               │  qty}      │  └──────────────┘
                                               └──────┬─────┘
                                                      │
                  ┌──────────┐                        │
                  │ COUPONS  │                        │
                  │ code     │                        │ on checkout
                  │ discount │                        │
                  └────┬─────┘                        │
                       │                              ▼
                       │   couponCode      ┌─────────────────┐
                       └──────────────────►│    ORDERS       │ id (DA…)
                                           │    userId       │
                                           │    items[]      │ embedded items
                                           │      └─ returnRequest (per item)
                                           │    address      │
                                           │    paymentDetails│
                                           │    deliveryQuote│ snapshot
                                           └─────────────────┘
                                                      ▲
                                                      │ references
                                                      │
   ┌─────────────────┐                          ┌─────┴────────┐
   │ DELIVERY_SETTING│                          │   PRODUCTS   │ id, slug
   │ key='main'      │  consulted by            │   stock      │
   │ slabs[]         │  quoteDelivery()         │   ratings    │
   │ storePincode    │                          └──────┬───────┘
   └─────────────────┘                                 │
                                                       │ referenced by
                                                       │
   ┌─────────────────┐                                 ▼
   │   PINCODES      │ pincode (PK)           ┌────────────────┐
   │   distanceKm    │                        │   REVIEWS      │
   │   deliverable   │                        │   productId    │
   │   city, state   │                        │   userId       │
   └─────────────────┘                        │   rating       │
                                              └────────────────┘
   ┌─────────────────┐                ┌──────────────┐
   │  SITE_SETTINGS  │                │   BANNERS    │
   │  key='main'     │                │   order      │
   │  company{}      │                │   image      │
   │  socials{}      │                │   active     │
   │  content{}      │                └──────────────┘
   └─────────────────┘
                                 LEAF COLLECTIONS
                                 ────────────────
   • signup_otps  (email, code, expiresAt)
   • otps         (email, code, expiresAt)
   • pwresets     (email, token, expiresAt)
   • contact_messages  (form submissions)
   • newsletter        (emails)
   • categories, brands  (catalogue taxonomy)
   • _meta            (seedVersion lock)
```

---

## 7. Build / deploy pipeline

```
   Developer
      │
      │ git push
      ▼
   GitHub repo
      │
      │ webhook
      ▼
   Vercel build
      ├── yarn install --frozen-lockfile  (uses yarn.lock)
      ├── yarn build                       (next build)
      └── 29 routes generated:
           • 14 static (home, about, faq, support, policy pages, etc.)
           • 9 dynamic-server-rendered (products/[id], orders/[id], admin, checkout, …)
           • 4 SSG-with-revalidate (sitemap.xml, robots.txt, …)
      │
      ▼ deploy to edge + serverless functions
      ▼
   dharaaadhvika.in (via DNS A=76.76.21.21 + CNAME www=cname.vercel-dns.com)
      │
      ▼
   First request triggers ensureSeeded() — populates the catalogue + admin user + pincodes (idempotent).
```

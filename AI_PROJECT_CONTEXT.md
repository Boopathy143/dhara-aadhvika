# AI_PROJECT_CONTEXT.md

> Single-page context dump for any AI assistant working on **Dhara Aadhvika**.

---

## 1. Architecture summary (one paragraph)

This is a **single-process Next.js 15 (App Router) app**. It serves both the storefront UI (React Server Components + Client Components) AND the entire REST API. The API lives in a **single catch-all** file `app/api/[[...path]]/route.js` (≈970 lines) using a `handle(method, segments, request)` dispatcher and plain `if (path === '...')` blocks. Storage is **MongoDB** (driver `mongodb@6.6.0`) with the client cached on `globalThis._mongoClientPromise`. Auth is **opaque cookie sessions** stored in a `sessions` collection — **not JWT**. Email is **nodemailer + Gmail SMTP**. State on the client is **SWR** for server cache + `useState` for local UI — no Redux. UI is **Tailwind + shadcn/ui + Radix**. Payment is **manual UPI** (customer uploads tx-id + receipt; admin reviews) or **COD**. Delivery is **PIN-code distance-based** with admin-editable slabs (no Google Maps).

In the Emergent preview pod, a tiny FastAPI reverse-proxy at `/app/backend/server.py` forwards `/api/*` from port 8001 (K8s ingress target) to port 3000 (Next.js). This proxy is **irrelevant for production** (Vercel / VPS) where Next.js owns `/api/*` directly.

---

## 2. Critical files (read in this order)

| Order | File | Purpose |
|---|---|---|
| 1 | `app/api/[[...path]]/route.js` | THE backend — every endpoint |
| 2 | `lib/db.js` | Mongo singleton |
| 3 | `lib/auth.js` | scrypt + opaque sessions |
| 4 | `lib/seed-data.js` | Catalogue seed (`SEED_VERSION` flag) |
| 5 | `lib/email.js` | SMTP transport + branded HTML |
| 6 | `lib/company.js` | Brand constants (overridable via CMS) |
| 7 | `app/checkout/page.js` | Money flow on client |
| 8 | `app/admin/page.js` + `_cms.jsx` + `_users.jsx` + `_banners.jsx` + `_delivery.jsx` | Entire admin UI |
| 9 | `components/Footer.jsx` + `components/ContentPage.jsx` | Public reads CMS |

---

## 3. Database relationships

```
users (id)
   │
   ├── 1:N orders (userId)            ── items[] (embedded, with returnRequest per item)
   ├── 1:N addresses (userId)
   ├── 1:1 carts (userId)              ── items[]: {productId, qty}
   ├── 1:1 wishlists (userId)          ── items[]: productId
   ├── 1:N reviews (userId)
   ├── 1:N sessions (userId)           ── opaque tokens
   └── otps / signup_otps / pwresets   ── keyed by email

products (id)
   │
   ├── category (str → categories.id)
   ├── brand    (str → brands.id)
   └── referenced by orders.items[].productId, reviews.productId, wishlists.items[]

coupons (id, code)                    ── referenced by orders.couponCode

pincodes (pincode)                    ── consulted by quoteDelivery() for orders
delivery_settings (key='main')        ── slabs, threshold, fallback
site_settings (key='main')            ── CMS company + socials + page content
banners (id)                          ── homepage hero override
contact_messages, newsletter           ── leaf collections

_meta (key='seedVersion')             ── seed lock
```

No relational FKs — references are by string `id`. Stripping `_id` is required before JSON serialization (`const { _id, ...r } = doc`).

---

## 4. API flow (top-level routing)

Single catch-all file, single function `handle(method, segments, request)`:

```
Request → /api/[[...path]]/route.js → exported HTTP verbs
       → all delegate to handle(method, segments, request)
       → handle() invokes ensureSeeded() once, then
         long chain of `if (path === '/auth/login' && method === 'POST') { ... return json(...); }`
       → never reaches the end (each branch returns)
       → if no branch matches → 404
       → uncaught error → catch wraps into json({error}) with mapped status (401/403/500)
```

Major route prefixes:
- `/auth/*` (10 endpoints)
- `/profile`, `/profile/password`, `/addresses`
- `/categories`, `/brands`, `/products`, `/products/:id`, `/hero`, `/banners`
- `/cart/*`, `/wishlist/*`
- `/coupons/validate`
- `/orders`, `/orders/:id`, `/orders/:id/cancel`, `/orders/:id/reorder`, `/orders/:orderId/return/:productId`
- `/checkout/quote`
- `/delivery/quote`, `/settings`
- `/contact`, `/newsletter`, `/reviews`
- `/admin/*` (all `requireAdmin()`-gated)

---

## 5. Business rules

1. **Cart needs login.** All `/cart/*` endpoints `requireUser()`.
2. **Order needs deliverable PIN.** `quoteDelivery()` is called server-side during order creation; if the PIN's distance falls outside all slabs OR the PIN isn't in the lookup table AND fallback policy is `block`, the order is rejected with 400.
3. **UPI orders start as `payment_verification_pending`.** Admin must approve via `/admin/orders/:id/verify-payment` (`action='approve'`) — only then does the order move to `confirmed`.
4. **COD orders start as `placed`** and don't need verification.
5. **GST is hard-coded at 5%** (`Math.round((subtotal - discount) * 0.05)`). Phase 6 will replace with HSN-based CGST/SGST/IGST split when the real GSTIN is provided.
6. **Free shipping above `freeDeliveryThreshold`** (default ₹999, admin-editable).
7. **Coupons** are either `discountPct` (%) OR `discountFlat` (₹) — never both — with optional `minOrder`.
8. **Returns are per-line-item**, not per-order. Allowed only when `order.status === 'delivered'`.
9. **Deactivated users (`active: false`) cannot log in** via any path (password, OTP, signup-OTP completion).
10. **Email verification gate**: `emailVerified: false` users cannot log in with password (must complete OTP step or use OTP-login which sets the flag).
11. **Self-admin protection**: an admin cannot demote themselves or deactivate/delete themselves (`requireAdmin()` + explicit `me.id !== userId` checks).
12. **Seed is one-shot** — bumping `SEED_VERSION` wipes products/categories/brands/coupons (other collections preserved).

---

## 6. Admin workflow

Daily:
1. Open `/admin` → **Payments** tab → review any pending UPI receipts → Verify or Reject (with reason).
2. **Orders** tab → move newly verified orders through `confirmed → shipped → delivered`.
3. **Returns** tab → process any new return requests through `pending → under_review → approved/rejected → pickup_scheduled → pickup_completed → refunded/replaced → closed`.

Catalogue updates:
- **Products** tab → "Add Product" with all spec fields (ingredients, benefits, usage, storage, shelf life, manufacturer, country of origin, FSSAI, nutrition, weight + unit, key features, custom specs).

Marketing:
- **Banners** tab → swap hero slides.
- **Coupons** tab → seasonal codes.
- **Site Settings** → Page Content sub-tab → update About / Contact / Terms / Privacy / Shipping / Refund copy.
- **Site Settings** → Social Links → swap any social URL.

Operations:
- **Delivery** → manage PIN table, slabs, free threshold.
- **Users** → search, deactivate troublemakers, reset passwords on request.
- **Reviews** → delete inappropriate ones.

---

## 7. Customer workflow

1. Land on home → see banners, featured / trending / new / best-seller products.
2. Filter & sort on `/products`, open PDP, optionally write a review.
3. Sign up (email → 6-digit OTP) or sign in (password OR email OTP).
4. Add to cart, view cart, apply coupon, checkout.
5. Enter or pick address; pincode triggers delivery quote inline.
6. Choose UPI (upload tx-id + receipt) or COD.
7. Track from "My Orders" — timeline shows placed → confirmed → shipped → delivered.
8. Download invoice PDF anytime.
9. After delivery, request returns per item with photo proof.

---

## 8. Known issues

| Severity | Issue | Status |
|---|---|---|
| historical (fixed) | `Cannot access 'f' before initialization` — TDZ in `route.js` from declaring `DEFAULT_DELIVERY` inside `handle()` before its first use | ✅ Fixed by hoisting to module scope |
| open | No rate limiting on `/auth/login`, `/auth/otp/send`, `/auth/forgot` | P2 backlog |
| open | Payment receipts and banner images stored as base64 in Mongo — grows large | P2 backlog → S3/R2 |
| open | jsPDF lacks ₹ glyph; invoice uses "Rs." prefix (intentional) | by design |
| open | GST is flat 5% (no HSN, no CGST/SGST/IGST split) | Phase 6 |
| open | No 2FA for admin | P2 backlog |
| open | UPI verification is manual | Phase: payment gateway integration |
| open | Customer ledger / quotation system / reviews-moderation queue not built | Phase 4, 5, 9 |

---

## 9. Current roadmap

| Priority | Phase | Description | Status |
|---|---|---|---|
| ✅ done | 1 | Initial import + Next.js + Vercel-readiness | Done |
| ✅ done | 2 | Gmail SMTP OTP (signup, login, reset) | Done |
| ✅ done | 3 | Returns workflow (9 statuses) | Done |
| ✅ done | 4 | Product specs + units | Done |
| ✅ done | 5 | Payment receipt viewer (admin) + Pending/Verified/Rejected | Done |
| ✅ done | 6 | INR fix in PDF + invoice with company info | Done |
| ✅ done | 7 | Site Settings / Banners / Users panels (Phase 16 CMS) | Done |
| ✅ done | 8 | PIN-code distance-based delivery | Done |
| P0 | 4 | Customer Ledger (statement, PDF/Excel) | Queued |
| P0 | 5 | Quotation system | Queued |
| P0 | 6 | GST Tax Invoice (HSN, CGST/SGST/IGST, QR) — needs real GSTIN + FSSAI | Blocked on inputs |
| P1 | 9 | Reviews moderation queue + low-stock alerts + sales/GST reports + search analytics | Queued |
| P2 | — | S3/R2 image migration, payment gateway, WhatsApp ping, rate limiting, 2FA, Tiptap, real Distance Matrix API | Backlog |

Full PRD: `/app/memory/PRD.md`.
Full deployment guide: `/app/DEPLOYMENT.md`.
Full project bible: `/app/PROJECT_MASTER_DOCUMENTATION.md`.

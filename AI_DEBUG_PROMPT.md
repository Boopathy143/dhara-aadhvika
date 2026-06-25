# AI_DEBUG_PROMPT.md

Copy-paste this entire block into Claude / ChatGPT / Gemini / Cursor / OpenCode / GitHub Copilot before asking for help on this project.

---

```
You are debugging the "Dhara Aadhvika" Next.js e-commerce platform. Before
proposing any change, internalise the following project context. Do NOT
invent libraries, endpoints or patterns that aren't listed here.

## Stack
- Next.js 15.5.16 (App Router) on React 18.3.1
- MongoDB driver `mongodb@6.6.0` (NOT Mongoose, NOT Prisma)
- Yarn 1.22 (lockfile checked in; do not switch to npm or pnpm)
- Tailwind CSS 3.4 + shadcn/ui (Radix primitives) + lucide-react icons
- SWR for client-side data fetching (NOT React Query for new code; both are installed)
- nodemailer + Gmail SMTP for email
- jspdf + jspdf-autotable for invoice PDFs
- qrcode for UPI QR
- recharts for admin charts
- sonner for toasts (use `import { toast } from 'sonner'`)
- framer-motion for animations

## What this app does NOT have
- NO JWT, NO Bearer tokens. Auth is opaque cookie sessions in MongoDB.
- NO payment gateway (UPI is manual; admin verifies receipts)
- NO ORM. Direct MongoDB queries.
- NO microservices. Single Next.js process.
- NO Sentry / Datadog / GA4 / analytics
- NO image CDN — raw URLs or base64-in-Mongo (≤2 MB for receipts, ≤1.5 MB for banners)
- NO GraphQL
- NO Google Maps. Delivery is admin-maintained PIN-code lookup table.
- NO CSRF tokens. sameSite=lax cookies only.

## Architecture facts
- The ENTIRE backend lives in ONE file: `app/api/[[...path]]/route.js` (~970 lines).
  It uses a single `handle(method, segments, request)` function with chained
  `if (path === '/...' && method === '...')` branches.
- All MongoDB ids are STRINGS (uuid v4 or sluggable). `_id` (ObjectId) is
  ALWAYS stripped before returning JSON: `const { _id, ...r } = doc`.
- Datetime: store as native Date in Mongo, send ISO 8601 strings to clients.
- Currency: on screen use `inr(value)` from `lib/format.js` which returns "₹1,234".
  In PDFs use `inrPdf(value)` which returns "Rs. 1,234" (jsPDF helvetica
  has no ₹ glyph).
- Helpers that need to be called from handle() MUST be declared at MODULE TOP
  LEVEL, not inside handle(). Otherwise you'll hit a TDZ
  (`ReferenceError: Cannot access 'X' before initialization`) — this already
  bit us once in Phase 8.

## Conventions
- Add `data-testid` to every interactive element (button, input, dialog
  trigger). Kebab-case. Example: `data-testid="place-cod-btn"`.
- Hooks (useState, useEffect, useSWR) MUST run before any conditional `return`.
- New admin tabs go as separate files `app/admin/_<tab>.jsx`, imported in
  `app/admin/page.js`, added to both `<TabsList>` and `<TabsContent>`.
- New policy pages call `<ContentPage cmsKey="...">` so admin can override
  the copy via Site Settings without code changes.
- Auth helpers in `lib/auth.js`:
    requireUser() → throws 'UNAUTHORIZED' → caught → 401
    requireAdmin() → throws 'FORBIDDEN' → caught → 403
    getCurrentUser() → returns null if no session
    hashPassword/verifyPassword use Node crypto.scrypt (NOT bcrypt)
- Self-admin protection: an admin cannot demote / deactivate / delete
  themselves — already enforced in `/admin/users/:id` PUT/DELETE.

## Common error patterns
1. `Cannot access 'X' before initialization` after minification → TDZ.
   Hoist the offending `const` / `async function` to module scope (above
   `handle()`).
2. `UNAUTHORIZED` → caller didn't send the session cookie. Use
   `credentials: 'include'` (default in fetch from same origin) and ensure
   the user is signed in.
3. `Sorry, we cannot deliver to this PIN code` → PIN not in `pincodes`
   collection. Admin must add it via /admin → Delivery, OR change the
   delivery_settings.value.fallbackPolicy to "flat:<rs>".
4. Build OOM on Vercel → set NODE_OPTIONS=--max-old-space-size=2048.
5. SMTP "Could not send email" → wrong app password OR 2FA not enabled on
   the Gmail account.

## Where things live
- Brand constants: `lib/company.js` (CMS overrides via `/api/settings`)
- Seed data: `lib/seed-data.js`. `SEED_VERSION` constant — bumping wipes
  products/categories/brands/coupons.
- Delivery quote logic: top-level functions `getDeliverySettings()` and
  `quoteDelivery()` in `route.js`. DEFAULT_DELIVERY is the fallback shape.
- Invoice PDF: `app/orders/page.js → downloadInvoice(order)`.
- Auth flows: see endpoints `/auth/register`, `/auth/verify-signup-otp`,
  `/auth/login`, `/auth/otp/send`, `/auth/otp/verify`, `/auth/forgot`,
  `/auth/reset` in `route.js`.

## What I need from you
1. Read all of the above before proposing changes.
2. Quote the EXACT file paths and line ranges you intend to edit.
3. Show diffs in unified-diff format, not "replace this with that".
4. Preserve every existing `data-testid` and route. Do not change UI / branding
   / navigation / payment flow unless asked.
5. Never introduce a new library without asking — yarn is the only package
   manager.
6. Never replace MongoDB with Prisma or rewrite to TypeScript.
7. Never change the cookie-session model to JWT without an explicit
   integration playbook step.
8. If the change touches `route.js`, double-check that any new top-level
   helper is declared BEFORE the `handle()` function — not inside it.

## Now, the actual problem
<<< PASTE YOUR ERROR / STACK TRACE / FEATURE REQUEST HERE >>>
```

---

## How to use this prompt

1. Open ChatGPT / Claude / Gemini / Cursor chat / OpenCode session.
2. Paste the entire fenced block above as the FIRST message.
3. At the very bottom, replace `<<< PASTE YOUR ERROR ... >>>` with whatever you're debugging.
4. The assistant now has full architectural context and won't suggest changes that violate the project's conventions.

## Bonus: one-line ChatGPT shortcut

If you only have room for one sentence, use:

> *"This is a Next.js 15 (App Router) + MongoDB e-commerce app called Dhara Aadhvika. The entire backend is one file `app/api/[[...path]]/route.js` (~970 lines, single `handle()` function with chained `if (path === ...)` branches). Auth is opaque cookie sessions (NO JWT). Storage is direct MongoDB (NO ORM). Currency uses ₹ on screen and 'Rs.' in PDFs. Yarn 1 only. data-testid on every interactive element. ALL top-level helpers must be at module scope (TDZ-prone). Now: <issue>."*

# ERROR_PLAYBOOK.md

Look up the error message in **bold** and follow the playbook. Each entry includes: error, root cause, fix, debug commands, related files.

---

## 1. **`ReferenceError: Cannot access 'X' before initialization`** (where X = `f`, `g`, etc. after minification)

| Field | Value |
|---|---|
| **Cause** | Temporal Dead Zone — a `const` or `let` is referenced before its initializer runs. Minifier renamed the symbol to a single letter, hiding the real name. Most commonly hits when a helper is declared INSIDE `handle()` in `app/api/[[...path]]/route.js` but is called by a branch that executes BEFORE the declaration line. |
| **Fix** | Hoist the offending helper out of `handle()` to module top level (above the `handle` function definition). |
| **Debug commands** | <pre>tail -n 200 /var/log/supervisor/frontend.err.log \| grep -B2 -A12 "Cannot access"<br>grep -n "const DEFAULT_\|async function" app/api/\\[\\[...path\\]\\]/route.js</pre> |
| **Related files** | `app/api/[[...path]]/route.js`, any file using top-level `const` that's called by an earlier branch |
| **History** | Hit in Phase 8 when `DEFAULT_DELIVERY`/`getDeliverySettings`/`quoteDelivery` were declared inside `handle()` but `/orders` POST called them earlier. Fixed by hoisting. |

---

## 2. **`MongoServerSelectionError`** / API hangs for 30 s then 500s

| Field | Value |
|---|---|
| **Cause** | `MONGO_URL` is wrong, the Atlas cluster is paused, the cluster's IP whitelist doesn't include `0.0.0.0/0`, or the DB user lacks `readWrite`. |
| **Fix** | 1. Confirm `MONGO_URL` env var. 2. Atlas → Network Access → Add `0.0.0.0/0`. 3. Atlas → Database Access → user role = `readWrite@ecommerce`. |
| **Debug commands** | <pre>echo $MONGO_URL<br>mongosh "$MONGO_URL"<br>node -e "require('mongodb').MongoClient.connect(process.env.MONGO_URL).then(c=>{console.log('ok');c.close()}).catch(e=>console.error(e.message))"</pre> |
| **Related files** | `lib/db.js`, `frontend/.env`, Vercel project Environment Variables panel |

---

## 3. **`invalid credentials`** on /api/auth/login

| Field | Value |
|---|---|
| **Cause** | Email not registered OR password mismatch (scrypt verify failed). |
| **Fix** | If user registered via OTP-only flow they have no password — use Email-OTP tab instead. Otherwise reset password via Forgot Password. |
| **Debug commands** | <pre>mongosh "$MONGO_URL/$DB_NAME" --eval "db.users.findOne({email:'X'})"<br># If password is null → use OTP login</pre> |
| **Related files** | `lib/auth.js → verifyPassword()`, `app/api/[[...path]]/route.js` (route `/auth/login`) |

---

## 4. **`Please verify your email before logging in`** (403)

| Field | Value |
|---|---|
| **Cause** | User started signup but didn't complete the 6-digit OTP step. `emailVerified === false`. |
| **Fix** | Hit `POST /api/auth/resend-signup-otp` with their email, then complete `verify-signup-otp`. |
| **Debug commands** | <pre>mongosh "$MONGO_URL/$DB_NAME" --eval "db.signup_otps.find({email:'X'}).sort({createdAt:-1}).limit(1)"</pre> |
| **Related files** | `app/api/[[...path]]/route.js` (routes `/auth/register`, `/auth/verify-signup-otp`, `/auth/resend-signup-otp`), `app/register/page.js` |

---

## 5. **`Your account has been deactivated`** (403)

| Field | Value |
|---|---|
| **Cause** | Admin set `users.active = false` from Admin → Users → power-button icon. |
| **Fix** | Admin → Users → click the power icon again to reactivate. |
| **Debug commands** | <pre>mongosh "$MONGO_URL/$DB_NAME" --eval "db.users.updateOne({email:'X'},{\$set:{active:true}})"</pre> |
| **Related files** | `app/api/[[...path]]/route.js` (routes `/auth/login`, `/auth/verify-signup-otp`), `app/admin/_users.jsx` |

---

## 6. **`invalid or expired code`** on OTP entry

| Field | Value |
|---|---|
| **Cause** | OTP TTL passed (signup 5 min, login 10 min, reset 30 min) OR code is wrong OR code was already used. |
| **Fix** | Click "Resend OTP" — generates a fresh code. |
| **Debug commands** | <pre>mongosh "$MONGO_URL/$DB_NAME" --eval "db.signup_otps.find({email:'X'}).sort({createdAt:-1}).limit(3)"</pre> |
| **Related files** | `lib/email.js`, all `/auth/*` routes |

---

## 7. **`Could not send verification email`** (500) on registration

| Field | Value |
|---|---|
| **Cause** | SMTP credentials wrong OR Gmail rate limit hit (500/day free; 2000/day workspace) OR `SMTP_PASS` is regular password instead of app password. |
| **Fix** | 1. Verify Gmail account has 2FA on. 2. Generate a NEW app password at https://myaccount.google.com/apppasswords. 3. Update `SMTP_PASS` env var in Vercel. 4. Redeploy. |
| **Debug commands** | <pre>swaks -t test@example.com -s smtp.gmail.com -p 587 -tls -au $SMTP_USER -ap "$SMTP_PASS"<br>tail -n 100 /var/log/supervisor/frontend.err.log \| grep -i "smtp\|send fail"</pre> |
| **Related files** | `lib/email.js`, `frontend/.env` |

---

## 8. **`File must be under 2 MB`** / **`Only JPG, PNG or PDF accepted`** on payment receipt upload

| Field | Value |
|---|---|
| **Cause** | User uploaded a too-large image OR wrong MIME type. |
| **Fix** | User compresses image (TinyPNG / Photos app "small" export) OR scans receipt to PDF. |
| **Debug commands** | <pre># Inspect the failed upload in browser dev tools → Network → Payload</pre> |
| **Related files** | `components/UpiPayment.jsx` (`onFile()`), `app/orders/page.js` (`onReturnFile()` for return image) |

---

## 9. **`Sorry, we cannot deliver to this PIN code`** at checkout

| Field | Value |
|---|---|
| **Cause** | PIN not in `pincodes` collection (and `fallbackPolicy === 'block'`) OR PIN has `deliverable: false` OR PIN's `distanceKm` exceeds the highest slab's `toKm`. |
| **Fix** | Admin → Delivery → add the PIN with the correct `distanceKm` (≤ 20 km to be deliverable). OR change `delivery_settings.fallbackPolicy` to `flat:<rs>` to auto-charge a fallback rate. |
| **Debug commands** | <pre>curl "https://dharaaadhvika.in/api/delivery/quote?pincode=XXXXXX&subtotal=500"<br>mongosh "$MONGO_URL/$DB_NAME" --eval "db.pincodes.findOne({pincode:'XXXXXX'})"</pre> |
| **Related files** | `app/api/[[...path]]/route.js` (top-level `quoteDelivery()`), `app/admin/_delivery.jsx`, `app/checkout/page.js` |

---

## 10. **`UPI transaction ID and screenshot required`** (400)

| Field | Value |
|---|---|
| **Cause** | User clicked submit without filling both fields. Frontend should validate first; backend re-checks. |
| **Fix** | Customer fills both fields. Tx-ID ≥ 6 chars. |
| **Debug commands** | n/a — pure validation |
| **Related files** | `components/UpiPayment.jsx`, `app/api/[[...path]]/route.js` (route `/orders`) |

---

## 11. **`cart empty`** at /api/orders

| Field | Value |
|---|---|
| **Cause** | Cart got cleared between checkout-load and submit (rare race). OR user wiped cookies. |
| **Fix** | Reload the page; cart auto-restores from server (cart is server-side per-user). |
| **Debug commands** | <pre>mongosh "$MONGO_URL/$DB_NAME" --eval "db.carts.findOne({userId:'X'})"</pre> |
| **Related files** | `app/api/[[...path]]/route.js` (route `/orders`, `/cart`) |

---

## 12. **Build fails on Vercel** with OOM (`JavaScript heap out of memory`)

| Field | Value |
|---|---|
| **Cause** | Default 1-2 GB heap insufficient for `next build` on slow CI nodes. |
| **Fix** | Vercel Project → Settings → Environment Variables → add `NODE_OPTIONS=--max-old-space-size=2048` (or 4096). |
| **Debug commands** | View Vercel build log; look for "Killed" or "out of memory". |
| **Related files** | `next.config.js`, `package.json` |

---

## 13. **`"next start" does not work with "output: standalone" configuration`** warning

| Field | Value |
|---|---|
| **Cause** | `next.config.js` has `output: 'standalone'` (for Docker). On Vercel this warning is harmless — Vercel ignores `output: 'standalone'`. |
| **Fix** | Ignore on Vercel. For bare-metal `next start`, remove `output: 'standalone'` OR run `node .next/standalone/server.js` instead. |
| **Debug commands** | <pre>cat /app/frontend/next.config.js</pre> |
| **Related files** | `next.config.js` |

---

## 14. **API route returns 404** for a path that exists in code

| Field | Value |
|---|---|
| **Cause** | The path didn't match any `if (path === '/...')` branch in `handle()`. Common reasons: typo, missing method check, or your new branch is AFTER the `return err('not found...')` at the end. |
| **Fix** | Add or move the branch above the catch-all 404 return. Confirm method matches. |
| **Debug commands** | <pre>grep -n "path === '/yourroute'" app/api/\\[\\[...path\\]\\]/route.js</pre> |
| **Related files** | `app/api/[[...path]]/route.js` |

---

## 15. **`PayloadTooLargeError`** / **`Request body exceeds`** on Vercel

| Field | Value |
|---|---|
| **Cause** | Vercel functions have a 4.5 MB body limit. Banner / receipt upload is base64 (≈33% bloat) so the original image must be ≤3 MB. App caps at 2 MB but if you raised the limit, you'll hit Vercel's. |
| **Fix** | Compress on client OR move uploads to direct-to-S3 signed URLs. |
| **Debug commands** | Inspect request payload size in dev tools. |
| **Related files** | `components/UpiPayment.jsx`, `app/admin/_banners.jsx`, `app/orders/page.js` |

---

## 16. **Hot reload not working locally**

| Field | Value |
|---|---|
| **Cause** | You ran `yarn dev` which does `next build && next start` (production-like, no HMR). |
| **Fix** | Run `yarn dev:hot` instead. |
| **Debug commands** | <pre>cat /app/frontend/package.json \| grep dev</pre> |
| **Related files** | `package.json` |

---

## 17. **Build error: `react/no-unescaped-entities`** (e.g. `' can be escaped with &apos;`)

| Field | Value |
|---|---|
| **Cause** | Raw `'`, `"`, `<`, `>` in JSX text. Next.js's ESLint config enforces escapes. |
| **Fix** | Replace `'` with `&apos;`, `"` with `&quot;`, `&ldquo;`, `&rdquo;` as needed. |
| **Debug commands** | <pre>yarn lint</pre> |
| **Related files** | wherever lint points |

---

## 18. **Vercel deployment succeeds but custom domain shows "DNS_PROBE_FINISHED_NXDOMAIN"**

| Field | Value |
|---|---|
| **Cause** | DNS records not propagated yet OR records wrong. |
| **Fix** | 1. Wait up to 24 h. 2. Verify A record `@ → 76.76.21.21` and CNAME `www → cname.vercel-dns.com`. 3. Check at https://www.whatsmydns.net/. |
| **Debug commands** | <pre>dig +short A dharaaadhvika.in<br>dig +short CNAME www.dharaaadhvika.in</pre> |
| **Related files** | DNS panel at registrar (BigRock / GoDaddy / Cloudflare) |

---

## 19. **`UNAUTHORIZED`** / 401 even though user is logged in

| Field | Value |
|---|---|
| **Cause** | Session cookie missing OR expired (30-day TTL) OR session row deleted from DB. |
| **Fix** | Sign in again. If persistent, check the `sessions` collection in Mongo. |
| **Debug commands** | <pre>mongosh "$MONGO_URL/$DB_NAME" --eval "db.sessions.find({userId:'X'}).sort({createdAt:-1}).limit(1)"<br># Browser dev tools → Application → Cookies → session</pre> |
| **Related files** | `lib/auth.js`, `app/api/[[...path]]/route.js` |

---

## 20. **`FORBIDDEN`** / 403 on /admin/* routes

| Field | Value |
|---|---|
| **Cause** | Signed-in user has `role !== 'admin'`. |
| **Fix** | Admin → Users → set role to `admin` for that user. |
| **Debug commands** | <pre>mongosh "$MONGO_URL/$DB_NAME" --eval "db.users.updateOne({email:'X'},{\$set:{role:'admin'}})"</pre> |
| **Related files** | `lib/auth.js → requireAdmin()`, `app/admin/_users.jsx` |

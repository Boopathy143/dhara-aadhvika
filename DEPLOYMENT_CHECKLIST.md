# DEPLOYMENT_CHECKLIST.md

Use this checklist for every deployment of **Dhara Aadhvika** to production at `dharaaadhvika.in`.

---

## A. Pre-deployment checklist

### Code
- [ ] `yarn build` runs locally with zero errors (warnings OK)
- [ ] `yarn lint` returns no errors
- [ ] No `console.log` of secrets / PII in production code
- [ ] No `.env` files committed (verify `git status` is clean)
- [ ] `package.json` version bumped (semver)
- [ ] `CHANGELOG.md` updated with the release notes
- [ ] All `data-testid` attributes preserved (do not remove existing ones)

### Configuration
- [ ] `.env.example` matches the actual variables the app reads (compare against `lib/db.js`, `lib/email.js`, `app/layout.js`, `app/sitemap.js`, `app/robots.js`)
- [ ] No hard-coded URLs that should be in `NEXT_PUBLIC_BASE_URL`
- [ ] No hard-coded SMTP credentials
- [ ] `lib/company.js` defaults are sane fallbacks (CMS overrides win)

### Database
- [ ] MongoDB Atlas cluster created (M0 free tier minimum)
- [ ] Database user has `readWrite` role on `ecommerce` DB
- [ ] IP whitelist set to `0.0.0.0/0` (Vercel functions use rotating IPs)
- [ ] Connection string tested: `mongosh "$MONGO_URL"` connects
- [ ] Recommended indexes created (see `PROJECT_MASTER_DOCUMENTATION.md` §4)

### Email
- [ ] Gmail account `dharaaadhvika@gmail.com` has 2FA enabled
- [ ] App password generated at https://myaccount.google.com/apppasswords
- [ ] Test send: `swaks -t test@gmail.com -s smtp.gmail.com -p 587 -tls -au $SMTP_USER -ap "$SMTP_PASS"`
- [ ] SPF / DKIM not required for Gmail SMTP (Google handles it). For SendGrid migration, add SPF TXT record.

### Catalogue
- [ ] At least one product per category exists OR seed will populate defaults
- [ ] Banner images (Admin → Banners) are under 1.5 MB each
- [ ] Hero copy reviewed (Admin → Site Settings → Page Content)
- [ ] Terms / Privacy / Shipping / Refund pages reviewed

---

## B. Deployment checklist (Vercel)

### Project setup
- [ ] GitHub repo pushed via Emergent "Save to GitHub"
- [ ] Vercel project imported from GitHub
- [ ] **Root Directory** set to `frontend/`
- [ ] **Framework Preset**: Next.js (auto)
- [ ] **Build Command**: `yarn build`
- [ ] **Install Command**: `yarn install --frozen-lockfile`
- [ ] **Output Directory**: `.next` (default)
- [ ] **Node Version**: 20.x

### Environment variables (all in Production scope)
- [ ] `MONGO_URL` (Atlas connection string)
- [ ] `DB_NAME=ecommerce`
- [ ] `NEXT_PUBLIC_BASE_URL=https://dharaaadhvika.in`
- [ ] `AUTH_SECRET` (openssl rand -hex 32)
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_USER=dharaaadhvika@gmail.com`
- [ ] `SMTP_PASS` (16-char Google app password)
- [ ] `SMTP_FROM` (optional)
- [ ] `CORS_ORIGINS` (optional)

### Build
- [ ] First deploy completes within 3 minutes
- [ ] Build log shows no errors
- [ ] Production URL `https://<project>.vercel.app` returns 200

---

## C. Domain checklist

- [ ] In Vercel → Settings → Domains → added BOTH `dharaaadhvika.in` and `www.dharaaadhvika.in`
- [ ] At domain registrar's DNS panel:
  - [ ] Removed any conflicting A or CNAME records on `@` and `www`
  - [ ] Added `A @ 76.76.21.21` (TTL 3600)
  - [ ] Added `CNAME www cname.vercel-dns.com` (TTL 3600)
- [ ] DNS propagation confirmed: https://www.whatsmydns.net/#A/dharaaadhvika.in
- [ ] `curl -I https://dharaaadhvika.in` returns 200
- [ ] `curl -I https://www.dharaaadhvika.in` returns 200 (or 308 redirect to apex)
- [ ] `curl -I http://dharaaadhvika.in` returns 308 → https

### Optional: Cloudflare in front
- [ ] Domain added to Cloudflare
- [ ] Nameservers updated at registrar to Cloudflare's
- [ ] SSL mode: **Full (strict)**
- [ ] "Always Use HTTPS": ON
- [ ] Page rule: bypass cache for `/api/*` and `/admin/*`

---

## D. SSL checklist

- [ ] Vercel SSL provisioned (badge shows green padlock in dashboard)
- [ ] Certificate covers both `dharaaadhvika.in` and `www.dharaaadhvika.in`
- [ ] `curl -vI https://dharaaadhvika.in 2>&1 | grep -i "subject\|expire"` shows the Vercel cert
- [ ] No mixed-content warnings in browser dev tools

---

## E. Database checklist

- [ ] Cluster size adequate (M0 OK for ≤10 GB; upgrade to M10 for production traffic)
- [ ] Backups enabled (continuous PITR on M10+; manual snapshots on M0)
- [ ] Monitoring alerts set up (high connection count, slow query, disk %)
- [ ] After first deploy + first API hit:
  - [ ] `db.products.countDocuments()` returns 30 (seed)
  - [ ] `db.categories.countDocuments()` returns 8
  - [ ] `db.brands.countDocuments()` returns 4
  - [ ] `db.coupons.countDocuments()` returns 3 (`DHARA10`, `PURE500`, `NEWLEAF`)
  - [ ] `db.pincodes.countDocuments()` returns 8 (seeded)
  - [ ] `db.users.find({role:'admin'}).count()` returns 1 (admin@dhara.com)

### Post-seed manual steps
- [ ] Log in as `admin@dhara.com` / `admin123`
- [ ] Admin → Users → reset password for admin@dhara.com (do NOT use the default in production)
- [ ] Admin → Users → DELETE `user@dhara.com` (demo account)
- [ ] Admin → Site Settings → fill in real company info (GSTIN, FSSAI when issued)
- [ ] Admin → Delivery → add the PIN codes you actually serve

---

## F. Email checklist

- [ ] Trigger a signup with a real email — verify the OTP arrives in inbox (not spam)
- [ ] Trigger forgot-password — verify the 6-digit code arrives in inbox
- [ ] Trigger login OTP — verify it arrives
- [ ] Inspect the email's "From" header — should be `dharaaadhvika@gmail.com`
- [ ] Inspect the email's HTML — branding (DHARA AADHVIKA logo text + colours) is correct
- [ ] Gmail rate limit (500/day free / 2000/day workspace) not hit
- [ ] Spam folder check: if emails land in spam, add a low-risk Gmail signature OR migrate to SendGrid

---

## G. Post-deployment smoke tests (run in order)

- [ ] `GET https://dharaaadhvika.in/` returns 200 with hero slider visible
- [ ] `GET https://dharaaadhvika.in/products` lists 30 products
- [ ] `GET https://dharaaadhvika.in/products/p-001` returns the PDP
- [ ] `GET https://dharaaadhvika.in/sitemap.xml` returns valid XML with >40 URLs
- [ ] `GET https://dharaaadhvika.in/robots.txt` disallows /admin /checkout /orders /cart /api
- [ ] Register a new account → OTP received → verified → logged in
- [ ] Sign out, sign back in with password
- [ ] Add a product to cart
- [ ] Checkout with PIN 638502 → COD → "Order Confirmed!"
- [ ] My Orders → invoice PDF downloads with "Rs." prefix
- [ ] Sign in as admin → all 10 admin tabs load without errors
- [ ] Admin → Payments → no orphaned UPI orders
- [ ] Admin → Site Settings → save a copy change → verify it reflects on `/contact`
- [ ] Admin → Banners → upload a small image → verify it appears on `/`
- [ ] Admin → Delivery → test a known PIN → returns correct slab + ₹

---

## H. Final sign-off

- [ ] CHANGELOG updated and merged to main
- [ ] `/admin` login credentials shared with the owner (Boopathy.K) via secure channel — NOT email
- [ ] Domain owner verified that DNS / SSL / email all work
- [ ] Google Search Console: submit `https://dharaaadhvika.in/sitemap.xml`
- [ ] Bing Webmaster Tools: submit the same sitemap
- [ ] First marketing campaign / Instagram post links to the live domain
- [ ] Backup procedure documented (`DATABASE_BACKUP_GUIDE.md`) shared with the owner

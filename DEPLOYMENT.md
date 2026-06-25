# Dhara Aadhvika — Production Deployment Guide

This document describes how to deploy the Next.js storefront + Mongo backend to
production at **https://dharaaadhvika.in**.

The same codebase that runs in the preview pod runs in production — there are no
forks, no separate branches. Only **environment variables** change.

---

## 1. Architecture (production)

```
                ┌──────────────────────┐
  Internet ───► │ Cloudflare / CDN     │
                │  SSL, WAF, image-opt │
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │  Next.js app         │  (port 3000, Node 20)
                │  (handles /, /api/*) │  PM2 / Docker / Vercel
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │  MongoDB Atlas       │  (or self-hosted replica set)
                └──────────────────────┘
```

The Next.js app handles **both** the storefront and the JSON API at `/api/*` — no
separate backend service is required.

---

## 2. Domain & DNS

Domain: **dharaaadhvika.in**

| Type  | Name | Value                                     |
|-------|------|-------------------------------------------|
| A     | @    | <your-server-ip>                          |
| A     | www  | <your-server-ip>                          |
| CNAME | mail | smtp.gmail.com (handled by Gmail Workspace) |

After DNS propagates (~10 min), point Cloudflare (or your CDN) at the origin and
turn **on** "Always Use HTTPS" + "Automatic HTTPS Rewrites".

---

## 3. Environment variables (`/app/frontend/.env`)

```bash
# Mongo
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
DB_NAME=ecommerce

# Public URL (used by sitemap.xml, OpenGraph, password-reset emails)
NEXT_PUBLIC_BASE_URL=https://dharaaadhvika.in

# Session & CORS
AUTH_SECRET=<32+ char random string — generate with `openssl rand -hex 32`>
CORS_ORIGINS=https://dharaaadhvika.in,https://www.dharaaadhvika.in

# Email (Gmail SMTP — already wired)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dharaaadhvika@gmail.com
SMTP_PASS=<gmail app password>
SMTP_FROM=dharaaadhvika@gmail.com
```

**Do not** commit this file. The `.env` is in `.gitignore`.

---

## 4. Build & run

### Option A — Bare-metal / VM (recommended for cost control)

```bash
# 1. Install Node 20 + Yarn + MongoDB tools
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm i -g yarn pm2

# 2. Pull repo to /opt/dharaaadhvika
git clone <your-repo> /opt/dharaaadhvika
cd /opt/dharaaadhvika/frontend
cp .env.example .env   # then fill in the values from section 3
yarn install --production=false
yarn build

# 3. Run with PM2
pm2 start "yarn start" --name dhara-aadhvika --time
pm2 save
pm2 startup   # follow the printed command to install systemd service
```

Configure **nginx** in front of port 3000:

```nginx
server {
  listen 443 ssl http2;
  server_name dharaaadhvika.in www.dharaaadhvika.in;
  ssl_certificate     /etc/letsencrypt/live/dharaaadhvika.in/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/dharaaadhvika.in/privkey.pem;
  client_max_body_size 4M;     # for receipt / banner uploads
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server { listen 80; server_name dharaaadhvika.in www.dharaaadhvika.in; return 301 https://$host$request_uri; }
```

Get SSL via certbot:
```bash
sudo certbot --nginx -d dharaaadhvika.in -d www.dharaaadhvika.in
```

### Option B — Vercel (simplest)

1. Push the repo to GitHub.
2. Import in Vercel → root directory `frontend/`.
3. Set the env vars from section 3 in Vercel dashboard.
4. Set the production domain to `dharaaadhvika.in`.
5. Deploy. Vercel handles SSL + Edge automatically.

### Option C — Docker

```dockerfile
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
CMD ["yarn", "start"]
```

---

## 5. Database

Use **MongoDB Atlas M10+** (or a self-hosted 3-node replica set).

On first boot the app auto-seeds:
- 8 categories, 4 brands, 30 sample products
- Default admin: `admin@dhara.com` / `admin123`  ⚠️ **change immediately** from Admin → Users → Reset Password.
- Sample user: `user@dhara.com` / `user123` — **delete** in production from the admin users tab.

Recommended Atlas backups: **continuous PITR**, retain 7 days.

---

## 6. SSL / HTTPS

- Bare-metal: `certbot --nginx` (free Let's Encrypt, auto-renew via cron).
- Vercel: automatic.
- Cloudflare: set SSL mode to "Full (strict)".

---

## 7. SEO checklist

| File                | Status |
|---------------------|--------|
| `/sitemap.xml`      | ✅ dynamic, lists products + categories + static pages |
| `/robots.txt`       | ✅ dynamic, disallows `/admin /checkout /orders /cart /api` |
| `<title>` & meta    | ✅ in `app/layout.js` (OpenGraph + Twitter card) |
| Favicon             | ✅ `/public/favicon.ico` |
| Canonical URLs      | ✅ `metadataBase` set to `NEXT_PUBLIC_BASE_URL` |

**After go-live:**
1. Submit `https://dharaaadhvika.in/sitemap.xml` in Google Search Console.
2. Submit in Bing Webmaster Tools.
3. Add the property in Google Analytics 4 — drop the tag into `app/layout.js`.

---

## 8. Site Settings (no-code admin)

Everything below is editable from **Admin → Site Settings** without touching code:

- Company name, owner, address, phone, WhatsApp, email
- GSTIN, FSSAI license number
- Social URLs (Instagram, Facebook, YouTube, X)
- Homepage hero copy, About-section copy
- About-page body, Contact-page intro
- Terms & Conditions, Privacy Policy, Shipping Policy, Refund Policy

Banner slides (hero carousel) are managed from **Admin → Banners** with upload/URL/reorder/active-toggle.

---

## 9. Pre-launch checklist

- [ ] Change the admin password (Admin → Users → Reset)
- [ ] Delete demo `user@dhara.com` (Admin → Users → Delete)
- [ ] Update Company Info in Admin → Site Settings → Company Info
- [ ] Replace social URLs in Admin → Site Settings → Social Links
- [ ] Replace the four policy pages with your reviewed copy (Admin → Site Settings → Page Content)
- [ ] Upload 2–3 real banners (Admin → Banners)
- [ ] Create at least one published product per category
- [ ] Smoke test: register a new user (email OTP arrives), place an order (UPI + COD), download invoice
- [ ] Submit sitemap to Google Search Console
- [ ] Confirm GA4 / GTM tracking fires on `/`, `/products/[id]`, `/checkout/success`

---

## 10. Operating runbook

| Task                       | Where                                        |
|----------------------------|----------------------------------------------|
| Add / edit product         | Admin → Products → Add / Pencil icon         |
| Verify UPI payment         | Admin → Payments → 👁 receipt → Verify/Reject |
| Process a return           | Admin → Returns → dropdown status            |
| Refresh SMTP creds         | Edit `.env` → `pm2 restart dhara-aadhvika`   |
| Update policy page         | Admin → Site Settings → Page Content         |
| Change social link         | Admin → Site Settings → Social Links         |
| Backup DB                  | Atlas backup or `mongodump`                  |
| View error logs            | `pm2 logs dhara-aadhvika`                    |

---

## 11. Known limits & roadmap

- **Image storage**: banners and payment receipts are stored as base64 in MongoDB (≤2 MB). When traffic grows, migrate to S3/Cloudflare R2 with `next/image`.
- **Tax invoice**: currently uses a placeholder GSTIN. Replace with your real GSTIN in Site Settings to make invoices legally valid. (HSN codes are pending — coming in next iteration.)
- **Distance-based delivery**: PIN-code lookup table coming next; presently flat ₹49 / FREE>₹999.
- **Quotation system**: planned.
- **Customer ledger**: planned.

---

Last updated: 2026-06-25

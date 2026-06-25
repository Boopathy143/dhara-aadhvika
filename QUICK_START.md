# QUICK_START.md

> Run **Dhara Aadhvika** locally in **under 10 minutes**. Tested on macOS 14, Ubuntu 22.04, Windows 11 (WSL2).

---

## ⏱ Minute 0 — Prerequisites (skip if already installed)

```bash
node --version   # need v18.18 or higher (v20 LTS recommended)
yarn --version   # need 1.22.x
git  --version
```

If any are missing:
- **Node**: `nvm install 20` (https://github.com/nvm-sh/nvm)
- **Yarn**: `npm i -g yarn` (Yarn 1.x — DO NOT switch to npm or pnpm; the project pins yarn)
- **Git**: install from your OS package manager

You also need MongoDB. Two options:
- **Local**: `docker run -d --name mongo -p 27017:27017 mongo:7` (5 sec)
- **Free cloud**: create a free MongoDB Atlas M0 cluster at https://mongodb.com/cloud/atlas (~3 min — sign-up + cluster create + IP whitelist + connection string)

---

## ⏱ Minute 1 — Clone the repo

```bash
git clone <your-repo-url> dhara
cd dhara/frontend
```

---

## ⏱ Minute 2 — Install dependencies

```bash
yarn install
```
This pulls ~700 MB of node_modules. ~45 s on a decent connection.

---

## ⏱ Minute 3 — Configure environment

```bash
cp ../.env.example .env     # OR copy manually from /app/.env.example
nano .env                   # open in your editor
```

Set at minimum:
```env
MONGO_URL=mongodb://localhost:27017            # OR your Atlas SRV string
DB_NAME=ecommerce
NEXT_PUBLIC_BASE_URL=http://localhost:3000
AUTH_SECRET=$(openssl rand -hex 32)            # run this command, paste result

# Email is optional for local — leave SMTP_* blank to skip.
# If you want real OTP emails:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password            # https://myaccount.google.com/apppasswords
```

Without `SMTP_*`, OTP codes are printed to the server console — useful for dev.

---

## ⏱ Minute 4 — Build

```bash
yarn build
```
≈ 40 s. You should see "✓ Compiled successfully" and a route list ending in `Done in ...s.`

If it fails, see `ERROR_PLAYBOOK.md` § "Build failed".

---

## ⏱ Minute 5 — Run

```bash
# Production-like (faster startup, no HMR):
yarn start

# OR for hot-reload during active development:
yarn dev:hot
```

Open **http://localhost:3000** in your browser. You should see the storefront with hero slider + featured products.

---

## ⏱ Minute 6 — First-run seed (automatic)

On the first API hit, `ensureSeeded()` auto-populates:
- 8 categories
- 4 brands
- 30 products
- 3 coupons (`DHARA10`, `PURE500`, `NEWLEAF`)
- 8 PIN codes around Erode (638502)
- 1 admin user: `admin@dhara.com` / `admin123`
- 1 demo user: `user@dhara.com` / `user123`

Trigger it by visiting any page (the homepage is enough).

---

## ⏱ Minute 7 — Log in as admin

1. Open http://localhost:3000/login
2. Email: `admin@dhara.com`
3. Password: `admin123`
4. Sign in → you'll be redirected.
5. Visit http://localhost:3000/admin

You should see the admin dashboard with 10 tabs.

---

## ⏱ Minute 8 — Place a test order

1. Browse to http://localhost:3000/products and click any product.
2. Click "Add to Cart".
3. Go to http://localhost:3000/cart, then "Proceed to Checkout".
4. Fill the address form. Use **pincode `638502`** (the seeded store-origin PIN).
5. Wait for the green delivery banner to appear ("Delivering to Anthiyur • 0 km").
6. Select **Cash on Delivery**.
7. Click **Place Order (COD)** — you should see "Order Confirmed!" with an order ID.

---

## ⏱ Minute 9 — Verify everything works

- **My Orders** (`/orders`) — should list the new order with status "placed".
- **Download Invoice** — PDF downloads with "Rs." prefix and company info.
- **Admin → Orders** — admin can see the new order and change status to `confirmed → shipped → delivered`.
- **Mark as delivered**, then on `/orders` you can "Request Return" on a line item.

---

## ⏱ Minute 10 — You're done 🎉

If everything above worked, your local setup is identical to the production one (minus the domain + SSL).

### Common things you might want to do next

| Task | Where |
|---|---|
| Change brand name / contact / socials | http://localhost:3000/admin → Site Settings |
| Upload a hero banner | http://localhost:3000/admin → Banners |
| Add a product | http://localhost:3000/admin → Products → "+ Add Product" |
| Add more PIN codes | http://localhost:3000/admin → Delivery → "+ Add PIN" or "Bulk Import" |
| Test OTP signup | http://localhost:3000/register (logs to console if SMTP not set) |
| Inspect Mongo | `mongosh "$MONGO_URL/ecommerce"` → `db.products.findOne()` |

---

## Troubleshooting

### "yarn: command not found"
Install yarn: `npm i -g yarn`.

### "MongoServerSelectionError"
- Is MongoDB running? `docker ps` (if using docker) or `brew services list` (macOS).
- Is `MONGO_URL` correct in `.env`? Try `mongosh "$MONGO_URL"`.

### Port 3000 already in use
- macOS / Linux: `lsof -ti:3000 | xargs kill -9`
- Windows: `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`
- Or change the port: `next start --port 3001`

### Build OOM
```bash
NODE_OPTIONS=--max-old-space-size=4096 yarn build
```

### "Cannot find module 'mongodb'"
You skipped `yarn install`. Run it now.

### "Demo OTP shown on screen" (no real email)
That's the dev fallback — SMTP isn't configured. Either set the SMTP vars, or just type the code that appears in the server console.

### Everything looks broken / want a clean slate
```bash
# Drop the DB and reseed
mongosh "$MONGO_URL" --eval "db.getSiblingDB('ecommerce').dropDatabase()"
# Restart the server — ensureSeeded() will repopulate.
```

---

## Next steps

- Production deployment? See `DEPLOYMENT_CHECKLIST.md` and `/app/DEPLOYMENT.md`.
- Architecture overview? See `ARCHITECTURE_DIAGRAMS.md`.
- Adding features? Hand `AI_DEBUG_PROMPT.md` to your AI assistant first.
- Full reference? `PROJECT_MASTER_DOCUMENTATION.md`.

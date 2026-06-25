# SYSTEM_REQUIREMENTS.md

Minimum system requirements to develop, build and operate **Dhara Aadhvika**.

---

## Software versions

| Software | Minimum | Recommended | Tested with | Notes |
|---|---|---|---|---|
| **Node.js** | 18.18 | 20 LTS | 20.x | `package.json` doesn't pin engines; Vercel uses 20.x by default |
| **Yarn** | 1.22 | 1.22.22 | 1.22.22 | The `packageManager` field pins it. Do NOT use npm or pnpm. |
| **MongoDB** | 5.0 | 6.x / 7.x | Mongo Atlas (6.x) | Driver `mongodb@6.6.0` works with server 4.4+ |
| **OS** (local dev) | macOS 11 / Ubuntu 20.04 / Windows 11 (WSL2) | — | macOS 14, Ubuntu 22.04 | Linux containers in CI |
| **Git** | 2.30 | latest | 2.43 | For the GitHub push flow |

### Verify
```bash
node --version    # v20.x
yarn --version    # 1.22.22
mongosh --version # 2.x
git --version
```

---

## Hardware — local development

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8 GB+ (Next.js dev server is heavy) |
| Disk | 5 GB free | 10 GB+ |

`yarn install` pulls ~700 MB of node_modules. `.next/` build output ≈ 200 MB.

---

## Hardware — production

### Vercel
| Plan | Suitable for |
|---|---|
| Hobby (free) | <100 000 page views/month |
| Pro ($20/mo) | Most D2C stores up to ~1 M page views/month |
| Enterprise | Custom — only needed for >10 M/month |

Vercel Functions limits:
- Execution time: 10 s (Hobby), 60 s (Pro). Mostly fine — heaviest endpoint is `/sitemap.xml` which fetches catalogue.
- Request body: 4.5 MB.
- Memory: 1024 MB (Hobby), up to 3008 MB (Pro).

### VPS (self-host)
| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB (with swap) | 2 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| Bandwidth | 1 TB/mo | unlimited |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

A `t3.small` AWS EC2, Hetzner CX21, or DigitalOcean Basic 2GB easily runs this app.

---

## MongoDB hardware

### Atlas tier
| Tier | RAM | Storage | Conns | Suitable for |
|---|---|---|---|---|
| **M0 (free)** | 512 MB | 512 MB | 500 | Dev + tiny prod (<1 GB data) |
| **M2 ($9/mo)** | 2 GB | 2 GB | 500 | Early traction |
| **M5 ($25/mo)** | 5 GB | 5 GB | 1500 | Up to ~50k orders |
| **M10 ($57/mo)** | 2 GB ded. | 10 GB | 3000 | Production sweet spot — supports continuous backups, point-in-time restore |
| **M20+** | 4+ GB ded. | 20+ GB | 6000+ | Heavy traffic |

Data growth estimate: ~5 KB per order (with embedded items snapshot, no images). 100 orders/day ≈ 180 MB/year. Payment receipts (base64) add ~200 KB each — biggest pressure on DB size. **Migrate receipts to S3 when DB hits 5 GB.**

### Self-hosted MongoDB
- 3-node replica set, 4 GB RAM each, 50 GB SSD each, MongoDB 6.0+.
- Enable WiredTiger compression (default).
- Set `maxConns = 1000` minimum.

---

## Network requirements

### Outbound from the Next.js process
- **MongoDB**: port 27017 (Atlas) or whatever your `MONGO_URL` specifies. Atlas accepts connections from `0.0.0.0/0` when whitelisted.
- **SMTP**: smtp.gmail.com:587 (STARTTLS). Most cloud hosts allow this; some block port 25.
- **HTTPS (443)**: for any external image URLs you store in `products.image`.

### Inbound to the Next.js process
- **HTTPS (443)**: terminated by Vercel / Nginx / Cloudflare.
- **HTTP (80)**: only for redirect to HTTPS.

---

## Browser support

| Browser | Min version |
|---|---|
| Chrome / Edge | 100+ |
| Firefox | 100+ |
| Safari | 15+ |
| iOS Safari | 15+ |
| Samsung Internet | 18+ |

Tailwind CSS 3 covers these. The site uses CSS variables, grid, flexbox, and modern image formats (WebP for hero on Unsplash CDN). No IE11 support.

---

## Yarn install footprint

```
node_modules:     ~700 MB
yarn.lock:        ~150 KB
.next (build):    ~200 MB
```

Disk free needed for `yarn build && yarn start`: **2 GB minimum** (peak during build).

---

## Dependencies snapshot (top of package.json)

| Library | Version |
|---|---|
| next | 15.5.16 |
| react / react-dom | 18.3.1 |
| mongodb | 6.6.0 |
| nodemailer | 6.9.14 |
| jspdf | 4.2.1 |
| jspdf-autotable | 5.0.8 |
| qrcode | 1.5.4 |
| swr | 2.3.8 |
| recharts | 2.15.3 |
| tailwindcss | 3.4.1 |
| @radix-ui/* | latest 1.x / 2.x per component |
| lucide-react | 0.516.0 |
| sonner | 2.0.5 |
| zod | 3.25.67 |
| framer-motion | 11.18.0 |
| react-hook-form | 7.58.1 |

Full list: `/app/frontend/package.json`.

---

## Email throughput

- Gmail free: **500 emails/day** (hard limit).
- Gmail Workspace: **2000 emails/day**.
- If you'll exceed: migrate to SendGrid (40 000/mo free) or Brevo (300/day free → cheap paid).

---

## Quick environment verifier

Save as `bin/check-env.sh`:
```bash
#!/usr/bin/env bash
set -e
echo "Node:    $(node --version)"
echo "Yarn:    $(yarn --version)"
echo "Git:     $(git --version)"
echo "Mongosh: $(mongosh --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""
echo "Required env vars:"
for v in MONGO_URL DB_NAME NEXT_PUBLIC_BASE_URL SMTP_HOST SMTP_USER SMTP_PASS; do
  if [ -z "${!v:-}" ]; then echo "  ❌ $v missing"; else echo "  ✅ $v"; fi
done
echo ""
echo "Mongo reachable: $(mongosh "$MONGO_URL" --quiet --eval 'db.runCommand({ping:1}).ok' 2>/dev/null || echo NO)"
```

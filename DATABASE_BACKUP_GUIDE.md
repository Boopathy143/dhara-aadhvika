# DATABASE_BACKUP_GUIDE.md

Database: **MongoDB** (Atlas in production, local for dev).
Database name: value of `DB_NAME` env var (default `ecommerce`).

---

## 1. Daily routine (recommended)

### Atlas (production)
1. Atlas console → your cluster → **Backup** tab.
2. Enable **Cloud Backups** (continuous on M10+, snapshots on M2/M5).
3. Retention: 7 days minimum (1 year for legal/tax data).
4. Set up an alert: Atlas → Project → Alerts → "Backup snapshot failed".

### Local / VPS
Add a daily cron job:
```bash
sudo crontab -e
# Add:
0 2 * * * /usr/bin/mongodump --uri="$MONGO_URL/$DB_NAME" --gzip --archive=/var/backups/mongo/dhara-$(date +\%F).gz
```
Keep last 14 days:
```bash
0 3 * * * find /var/backups/mongo/ -name "dhara-*.gz" -mtime +14 -delete
```

---

## 2. Manual backup

### Full DB dump (all 21 collections)
```bash
# Using mongodump (need mongodb-database-tools)
mongodump --uri="$MONGO_URL/$DB_NAME" --gzip --archive=./dhara-backup-$(date +%F).gz

# Verify file
ls -lh dhara-backup-*.gz

# Sample restore preview
mongorestore --dry-run --gzip --archive=./dhara-backup-2026-06-25.gz
```

### Single collection
```bash
mongodump --uri="$MONGO_URL/$DB_NAME" --collection=orders \
          --gzip --archive=./orders-$(date +%F).gz
```

### To Atlas
Atlas cluster → **Backup** tab → "Take Snapshot Now". Snapshots are retained per your policy.

---

## 3. Restore

### Full DB (DESTRUCTIVE — overwrites everything)
```bash
mongorestore --uri="$MONGO_URL/$DB_NAME" --drop --gzip --archive=./dhara-backup-2026-06-25.gz
```
The `--drop` flag drops each collection before restoring it. Remove `--drop` to merge instead.

### Single collection
```bash
mongorestore --uri="$MONGO_URL/$DB_NAME" --drop --gzip \
             --nsInclude="${DB_NAME}.orders" --archive=./orders-2026-06-25.gz
```

### From Atlas snapshot
Atlas cluster → Backup → Restore → choose snapshot → "Restore to existing cluster" (rolls back the entire cluster) OR "Download archive" then `mongorestore` locally.

---

## 4. Export (human-readable / Excel-friendly)

### JSON
```bash
mongoexport --uri="$MONGO_URL/$DB_NAME" --collection=orders \
            --out=orders.json --jsonArray --pretty
```

### CSV
```bash
mongoexport --uri="$MONGO_URL/$DB_NAME" --collection=orders \
            --type=csv \
            --fields=id,userId,total,status,paymentMethod,createdAt \
            --out=orders.csv
```

### Filtered CSV (e.g. last 30 days)
```bash
mongoexport --uri="$MONGO_URL/$DB_NAME" --collection=orders \
            --query='{"createdAt":{"$gte":{"$date":"2026-05-25T00:00:00Z"}}}' \
            --type=csv --fields=id,total,status,createdAt --out=recent-orders.csv
```

---

## 5. Import

### From JSON
```bash
mongoimport --uri="$MONGO_URL/$DB_NAME" --collection=products \
            --file=products.json --jsonArray
```

### From CSV (with field types)
```bash
mongoimport --uri="$MONGO_URL/$DB_NAME" --collection=pincodes \
            --type=csv --headerline --file=pincodes.csv \
            --columnsHaveTypes --fields="pincode.string(),distanceKm.int32(),city.string(),state.string(),deliverable.boolean()"
```

> Heads-up: `mongoimport` does not run validators or business logic. Prefer the admin UI's bulk-import for PIN codes (it sets `updatedAt`, normalizes types).

---

## 6. Atlas migration (move cluster / region)

### Option A — Live migration (zero downtime, paid feature)
Atlas → cluster → "..." menu → **Migrate** → choose target cluster → start.

### Option B — Snapshot restore (5–30 min downtime)
1. Pause writes (put the app in maintenance mode or lock admin).
2. Take a manual snapshot on the source cluster.
3. Restore the snapshot into the target cluster.
4. Update `MONGO_URL` in Vercel → redeploy → app now points to target.
5. Verify with a smoke test (see DEPLOYMENT_CHECKLIST §G).
6. Decommission source cluster.

### Option C — `mongodump` / `mongorestore` (free, manual)
```bash
mongodump --uri="$SOURCE_URI/$DB_NAME" --gzip --archive=./migration.gz
mongorestore --uri="$TARGET_URI/$DB_NAME" --gzip --archive=./migration.gz
```

---

## 7. Backup verification (do this monthly)

```bash
# Restore the latest backup into a TEST DB
mongorestore --uri="$MONGO_URL/ecommerce_restore_test" --gzip --archive=./dhara-backup-latest.gz

# Verify counts
mongosh "$MONGO_URL/ecommerce_restore_test" --eval "
  ['products','users','orders','pincodes','site_settings'].forEach(c =>
    print(c.padEnd(20), db[c].countDocuments())
  )
"

# Drop the test DB
mongosh "$MONGO_URL" --eval "db.getSiblingDB('ecommerce_restore_test').dropDatabase()"
```

---

## 8. What to NEVER do

- ❌ `db.dropDatabase()` on production (no confirmation prompt!)
- ❌ Run `mongorestore --drop` without `--dryRun` first
- ❌ Edit `_meta.seedVersion` manually unless you want a destructive reseed
- ❌ Bump `SEED_VERSION` in `lib/seed-data.js` in production (wipes products/categories/brands/coupons)
- ❌ Commit `mongodump` output to git (often >50 MB; use `.gitignore` to block `*.gz`, `*.bson`, `dump/`)

---

## 9. Disaster recovery RTO/RPO targets

| Metric | Target |
|---|---|
| RPO (max data loss) | 1 hour (with continuous backups) / 24 hours (with daily snapshots) |
| RTO (max downtime) | 30 minutes (Atlas point-in-time restore) / 2 hours (manual mongorestore) |

---

## 10. Per-collection sensitivity

| Collection | Sensitivity | Notes |
|---|---|---|
| `users` | HIGH (PII + hashed passwords) | Encrypt at rest (Atlas default). Never export with `password` field. |
| `orders` | HIGH (PII + addresses + payment receipts) | GDPR / DPDP applies. 7-year retention for tax. |
| `addresses` | HIGH (PII) | Delete on user delete (already cascaded). |
| `sessions` | MEDIUM (auth tokens) | Don't include in cross-environment restores — invalidates everyone. |
| `pwresets`, `otps`, `signup_otps` | MEDIUM (short-lived secrets) | Don't include in restores either; TTL handles it. |
| `products`, `categories`, `brands`, `coupons`, `pincodes`, `banners`, `site_settings`, `delivery_settings`, `_meta` | LOW | Safe to share for staging environments. |
| `reviews`, `contact_messages`, `newsletter` | LOW-MEDIUM | Newsletter has email PII — observe unsubscribe rules. |

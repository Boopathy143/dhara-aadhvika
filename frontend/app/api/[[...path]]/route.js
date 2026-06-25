import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { col, getDb } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, destroySession, getCurrentUser, requireUser, requireAdmin } from '@/lib/auth';
import { sendOtpEmail, sendPasswordResetEmail, isEmailConfigured } from '@/lib/email';
import { CATEGORIES, BRANDS, PRODUCTS, HERO_SLIDES, SEED_VERSION } from '@/lib/seed-data';

const json = (data, status = 200) => NextResponse.json(data, { status });
const err = (message, status = 400) => NextResponse.json({ error: message }, { status });

// Seed a handful of nearby PIN codes around the Erode store (638502) so the
// distance-based delivery calculator works out of the box. Admin can add many
// more (or bulk-import) from Admin → Delivery. Idempotent — only seeds if
// the collection is empty.
async function ensurePincodesSeeded() {
  const pins = await col('pincodes');
  const count = await pins.estimatedDocumentCount();
  if (count > 0) return;
  await pins.bulkWrite([
    { pincode: '638502', distanceKm: 0,   deliverable: true, city: 'Anthiyur',         state: 'Tamil Nadu' },
    { pincode: '638501', distanceKm: 3,   deliverable: true, city: 'Anthiyur RS',      state: 'Tamil Nadu' },
    { pincode: '638503', distanceKm: 6,   deliverable: true, city: 'Bhavani',          state: 'Tamil Nadu' },
    { pincode: '638504', distanceKm: 9,   deliverable: true, city: 'Komarapalayam',    state: 'Tamil Nadu' },
    { pincode: '638505', distanceKm: 12,  deliverable: true, city: 'Sathyamangalam',   state: 'Tamil Nadu' },
    { pincode: '638001', distanceKm: 18,  deliverable: true, city: 'Erode',            state: 'Tamil Nadu' },
    { pincode: '600001', distanceKm: 450, deliverable: true, city: 'Chennai',          state: 'Tamil Nadu' },
    { pincode: '560001', distanceKm: 350, deliverable: true, city: 'Bengaluru',        state: 'Karnataka' },
  ].map(p => ({ updateOne: { filter: { pincode: p.pincode }, update: { $setOnInsert: { ...p, createdAt: new Date() } }, upsert: true } })));
}

async function ensureSeeded() {
  if (global._seedDone) return;
  if (global._seedPromise) return global._seedPromise;
  global._seedPromise = (async () => {
    const meta = await col('_meta');
    try { await meta.createIndex({ key: 1 }, { unique: true }); } catch {}
    // Always ensure pincodes are populated (idempotent — independent of main seed lock)
    await ensurePincodesSeeded();
    const existing = await meta.findOne({ key: 'seedVersion' });
    if (existing && existing.value === SEED_VERSION) { global._seedDone = true; return; }
    // Try to acquire lock atomically
    let acquired = false;
    try {
      await meta.insertOne({ key: 'seedLock', value: SEED_VERSION, at: new Date() });
      acquired = true;
    } catch {}
    if (!acquired) {
      // Another instance is seeding \u2014 poll until version is set
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 300));
        const v = await meta.findOne({ key: 'seedVersion' });
        if (v && v.value === SEED_VERSION) break;
      }
      global._seedDone = true; return;
    }
    // We hold the lock \u2014 do the seed
    const db = await getDb();
    for (const c of ['products', 'categories', 'brands', 'coupons']) {
      try { await db.collection(c).deleteMany({}); } catch {}
    }
    await (await col('categories')).insertMany(CATEGORIES.map(c => ({ ...c })));
  await (await col('brands')).insertMany(BRANDS.map(b => ({ ...b })));
  const now = new Date();
  await (await col('products')).insertMany(PRODUCTS.map((p, i) => ({
    id: 'p-' + (i + 1).toString().padStart(3, '0'),
    name: p.name, slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    brand: p.brand, category: p.category,
    price: p.price, mrp: p.mrp,
    image: p.image, images: [p.image],
    description: p.desc, ingredients: p.ingredients, benefits: p.benefits, nutrition: p.nutrition, weight: p.weight,
    specs: p.specs,
    stock: p.stock, rating: p.rating, ratingCount: 40 + Math.floor(Math.random() * 400),
    isFeatured: i < 8, isTrending: i % 2 === 0, isNew: i >= 18,
    isBestSeller: [0, 1, 4, 9, 12, 13, 16, 21].includes(i),
    createdAt: now,
  })));
  const users = await col('users');
  const adminExists = await users.findOne({ email: 'admin@dhara.com' });
  if (!adminExists) {
    await users.insertOne({ id: uuid(), name: 'Aadhvika Admin', email: 'admin@dhara.com', password: hashPassword('admin123'), role: 'admin', emailVerified: true, createdAt: now });
  }
  const userExists = await users.findOne({ email: 'user@dhara.com' });
  if (!userExists) {
    await users.insertOne({ id: uuid(), name: 'Anjali Sharma', email: 'user@dhara.com', password: hashPassword('user123'), role: 'user', emailVerified: true, createdAt: now });
  }
  await (await col('coupons')).insertMany([
    { id: uuid(), code: 'DHARA10', discountPct: 10, minOrder: 0, active: true, description: '10% off your first order' },
    { id: uuid(), code: 'PURE500', discountFlat: 500, minOrder: 2500, active: true, description: '₹500 off on orders above ₹2500' },
    { id: uuid(), code: 'NEWLEAF', discountPct: 15, minOrder: 1000, active: true, description: '15% off above ₹1000' },
  ]);
  // Seed inside main seed lock as well, for fresh installs.
  await ensurePincodesSeeded();
  await meta.updateOne({ key: 'seedVersion' }, { $set: { value: SEED_VERSION } }, { upsert: true });
    global._seedDone = true;
  })();
  return global._seedPromise;
}

async function handle(method, segments, request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const path = '/' + segments.join('/');

  if (path === '/hero' && method === 'GET') return json(HERO_SLIDES);
  if (path === '/categories' && method === 'GET') {
    const items = await (await col('categories')).find({}).toArray();
    return json(items.map(({ _id, ...r }) => r));
  }
  if (path === '/brands' && method === 'GET') {
    const items = await (await col('brands')).find({}).toArray();
    return json(items.map(({ _id, ...r }) => r));
  }

  if (path === '/products' && method === 'GET') {
    const products = await col('products');
    const filter = {};
    const q = url.searchParams.get('q');
    const category = url.searchParams.get('category');
    const brand = url.searchParams.get('brand');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const minRating = url.searchParams.get('minRating');
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) {
      const cat = await (await col('categories')).findOne({ $or: [{ slug: category }, { id: category }] });
      if (cat) filter.category = cat.id;
      else filter.category = '__none__';
    }
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (url.searchParams.get('featured') === '1') filter.isFeatured = true;
    if (url.searchParams.get('trending') === '1') filter.isTrending = true;
    if (url.searchParams.get('new') === '1') filter.isNew = true;
    if (url.searchParams.get('bestSeller') === '1') filter.isBestSeller = true;
    const sort = url.searchParams.get('sort') || 'newest';
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };
    if (sort === 'discount') sortObj = { mrp: -1 };
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(48, parseInt(url.searchParams.get('limit') || '12'));
    const total = await products.countDocuments(filter);
    const items = await products.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).toArray();
    return json({ items: items.map(({ _id, ...r }) => r), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  }

  if (path.startsWith('/products/') && method === 'GET') {
    const id = segments[1];
    const p = await (await col('products')).findOne({ id });
    if (!p) return err('not found', 404);
    const { _id, ...rest } = p;
    const related = await (await col('products')).find({ category: p.category, id: { $ne: p.id } }).limit(6).toArray();
    const reviews = await (await col('reviews')).find({ productId: id }).sort({ createdAt: -1 }).toArray();
    return json({ product: rest, related: related.map(({ _id, ...r }) => r), reviews: reviews.map(({ _id, ...r }) => r) });
  }

  if (path === '/admin/products' && method === 'POST') {
    await requireAdmin();
    const body = await request.json();
    const id = 'p-' + uuid().slice(0, 8);
    const doc = { id, slug: (body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), createdAt: new Date(), ratingCount: 0, rating: 0, ...body };
    await (await col('products')).insertOne(doc);
    const { _id, ...r } = doc;
    return json(r);
  }
  if (path.startsWith('/admin/products/') && method === 'PUT') {
    await requireAdmin();
    const id = segments[2];
    const body = await request.json();
    delete body._id; delete body.id;
    await (await col('products')).updateOne({ id }, { $set: body });
    return json({ ok: true });
  }
  if (path.startsWith('/admin/products/') && method === 'DELETE') {
    await requireAdmin();
    const id = segments[2];
    await (await col('products')).deleteOne({ id });
    return json({ ok: true });
  }

  // --- AUTH ---
  if (path === '/auth/register' && method === 'POST') {
    const { name, email, password } = await request.json();
    if (!email || !password) return err('email & password required');
    if (password.length < 6) return err('Password must be 6+ characters');
    const users = await col('users');
    const existing = await users.findOne({ email });
    if (existing && existing.emailVerified) return err('email already registered', 409);
    const id = existing ? existing.id : uuid();
    if (existing) {
      await users.updateOne({ id }, { $set: { name: name || existing.name, password: hashPassword(password) } });
    } else {
      await users.insertOne({ id, name: name || email.split('@')[0], email, password: hashPassword(password), role: 'user', emailVerified: false, createdAt: new Date() });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await (await col('signup_otps')).deleteMany({ email });
    await (await col('signup_otps')).insertOne({ email, code, expiresAt, used: false, createdAt: new Date() });
    const { sent, devCode, error: mailError } = await sendOtpEmail(email, code, { purpose: 'verify your DHARA AADHVIKA account', expiryMinutes: 5 });
    if (!sent && isEmailConfigured()) return err(`Could not send verification email${mailError ? ': ' + mailError : ''}`, 500);
    const payload = { requiresOtp: true, email, message: sent ? 'OTP sent to your email.' : 'OTP generated (email service not configured — dev code shown).' };
    if (!sent && devCode) payload.devCode = devCode;
    return json(payload);
  }
  if (path === '/auth/verify-signup-otp' && method === 'POST') {
    const { email, code } = await request.json();
    if (!email || !code) return err('email & code required');
    const otps = await col('signup_otps');
    const rec = await otps.findOne({ email, used: false });
    if (!rec || rec.code !== code) return err('invalid or expired code', 401);
    if (new Date(rec.expiresAt) < new Date()) return err('code expired — please resend', 401);
    await otps.updateOne({ _id: rec._id }, { $set: { used: true } });
    const users = await col('users');
    const u = await users.findOne({ email });
    if (!u) return err('signup session not found, please register again', 404);
    await users.updateOne({ id: u.id }, { $set: { emailVerified: true } });
    await createSession(u.id);
    return json({ id: u.id, name: u.name, email: u.email, role: u.role });
  }
  if (path === '/auth/resend-signup-otp' && method === 'POST') {
    const { email } = await request.json();
    if (!email) return err('email required');
    const users = await col('users');
    const u = await users.findOne({ email });
    if (!u) return err('signup session not found, please register again', 404);
    if (u.emailVerified) return err('account already verified, please sign in', 409);
    const otps = await col('signup_otps');
    const last = await otps.findOne({ email }, { sort: { createdAt: -1 } });
    if (last && Date.now() - new Date(last.createdAt).getTime() < 30 * 1000) {
      return err('Please wait a few seconds before requesting another code', 429);
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await otps.deleteMany({ email });
    await otps.insertOne({ email, code, expiresAt, used: false, createdAt: new Date() });
    const { sent, devCode, error: mailError } = await sendOtpEmail(email, code, { purpose: 'verify your DHARA AADHVIKA account', expiryMinutes: 5 });
    if (!sent && isEmailConfigured()) return err(`Could not send verification email${mailError ? ': ' + mailError : ''}`, 500);
    const payload = { ok: true, message: sent ? 'OTP resent to your email.' : 'OTP generated (email service not configured — dev code shown).' };
    if (!sent && devCode) payload.devCode = devCode;
    return json(payload);
  }
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = await request.json();
    const users = await col('users');
    const u = await users.findOne({ email });
    if (!u || !verifyPassword(password, u.password)) return err('invalid credentials', 401);
    if (!u.emailVerified) return err('Please verify your email before logging in', 403);
    if (u.active === false) return err('Your account has been deactivated. Please contact support.', 403);
    await createSession(u.id);
    return json({ id: u.id, name: u.name, email: u.email, role: u.role });
  }
  if (path === '/auth/logout' && method === 'POST') { await destroySession(); return json({ ok: true }); }
  if (path === '/auth/me' && method === 'GET') { return json({ user: await getCurrentUser() }); }
  if (path === '/auth/otp/send' && method === 'POST') {
    const { email } = await request.json();
    if (!email) return err('email required');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await (await col('otps')).insertOne({ email, code, expiresAt, used: false, createdAt: new Date() });
    const { sent, devCode, error: mailError } = await sendOtpEmail(email, code, { purpose: 'sign in to your DHARA AADHVIKA account', expiryMinutes: 10 });
    if (!sent && isEmailConfigured()) return err(`Could not send sign-in email${mailError ? ': ' + mailError : ''}`, 500);
    const payload = { ok: true, message: sent ? 'OTP sent to your email.' : 'OTP generated (email service not configured — dev code shown).' };
    if (!sent && devCode) payload.devCode = devCode;
    return json(payload);
  }
  if (path === '/auth/otp/verify' && method === 'POST') {
    const { email, code } = await request.json();
    const otps = await col('otps');
    const rec = await otps.findOne({ email, code, used: false });
    if (!rec) return err('invalid or expired code', 401);
    if (new Date(rec.expiresAt) < new Date()) return err('code expired', 401);
    await otps.updateOne({ _id: rec._id }, { $set: { used: true } });
    const users = await col('users');
    let u = await users.findOne({ email });
    if (!u) {
      const id = uuid();
      u = { id, name: email.split('@')[0], email, password: null, role: 'user', emailVerified: true, createdAt: new Date() };
      await users.insertOne(u);
    } else {
      if (u.active === false) return err('Your account has been deactivated. Please contact support.', 403);
      await users.updateOne({ id: u.id }, { $set: { emailVerified: true } });
    }
    await createSession(u.id);
    return json({ id: u.id, name: u.name, email: u.email, role: u.role });
  }
  // Forgot password
  if (path === '/auth/forgot' && method === 'POST') {
    const { email } = await request.json();
    const users = await col('users');
    const u = await users.findOne({ email });
    // Always return ok to avoid leaking which emails are registered
    if (!u) return json({ ok: true, message: 'If this email is registered, a reset code has been sent.' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await (await col('pwresets')).deleteMany({ email });
    await (await col('pwresets')).insertOne({ email, token: code, used: false, expiresAt, createdAt: new Date() });
    const { sent, devCode, error: mailError } = await sendPasswordResetEmail(email, code, { expiryMinutes: 30 });
    if (!sent && isEmailConfigured()) return err(`Could not send reset email${mailError ? ': ' + mailError : ''}`, 500);
    const payload = { ok: true, email, message: sent ? 'Reset code sent to your email.' : 'Reset code generated (email not configured — dev code shown).' };
    if (!sent && devCode) payload.devToken = devCode;
    return json(payload);
  }
  if (path === '/auth/reset' && method === 'POST') {
    const { email, token, password } = await request.json();
    if (!token || !password) return err('token & password required');
    const rs = await col('pwresets');
    const query = email ? { email, token, used: false } : { token, used: false };
    const r = await rs.findOne(query);
    if (!r || new Date(r.expiresAt) < new Date()) return err('invalid or expired code', 401);
    await (await col('users')).updateOne({ email: r.email }, { $set: { password: hashPassword(password) } });
    await rs.updateOne({ _id: r._id }, { $set: { used: true } });
    return json({ ok: true });
  }

  // --- USER PROFILE & ADDRESSES ---
  if (path === '/profile' && method === 'PUT') {
    const u = await requireUser();
    const { name } = await request.json();
    if (name) await (await col('users')).updateOne({ id: u.id }, { $set: { name } });
    return json({ ok: true });
  }
  if (path === '/profile/password' && method === 'POST') {
    const u = await requireUser();
    const { oldPassword, newPassword } = await request.json();
    const users = await col('users');
    const full = await users.findOne({ id: u.id });
    if (full.password && !verifyPassword(oldPassword, full.password)) return err('wrong current password', 401);
    await users.updateOne({ id: u.id }, { $set: { password: hashPassword(newPassword) } });
    return json({ ok: true });
  }
  if (path === '/addresses' && method === 'GET') {
    const u = await requireUser();
    const items = await (await col('addresses')).find({ userId: u.id }).toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  if (path === '/addresses' && method === 'POST') {
    const u = await requireUser();
    const body = await request.json();
    const item = { id: uuid(), userId: u.id, ...body, createdAt: new Date() };
    await (await col('addresses')).insertOne(item);
    const { _id, ...r } = item;
    return json(r);
  }
  if (path.startsWith('/addresses/') && method === 'DELETE') {
    const u = await requireUser();
    await (await col('addresses')).deleteOne({ id: segments[1], userId: u.id });
    return json({ ok: true });
  }

  // --- CART ---
  if (path === '/cart' && method === 'GET') {
    const u = await getCurrentUser();
    if (!u) return json({ items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 });
    const cart = await (await col('carts')).findOne({ userId: u.id });
    const items = cart?.items || [];
    const productIds = items.map(i => i.productId);
    const prods = await (await col('products')).find({ id: { $in: productIds } }).toArray();
    const detailed = items.map(it => {
      const p = prods.find(x => x.id === it.productId);
      if (!p) return null;
      return { productId: p.id, name: p.name, image: p.image, price: p.price, mrp: p.mrp, stock: p.stock, qty: it.qty };
    }).filter(Boolean);
    const subtotal = detailed.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = Math.round(subtotal * 0.05);
    const shipping = subtotal === 0 ? 0 : subtotal > 999 ? 0 : 49;
    return json({ items: detailed, subtotal, tax, shipping, total: subtotal + tax + shipping });
  }
  if (path === '/cart/add' && method === 'POST') {
    const u = await requireUser();
    const { productId, qty = 1 } = await request.json();
    const carts = await col('carts');
    const existing = await carts.findOne({ userId: u.id });
    if (!existing) await carts.insertOne({ userId: u.id, items: [{ productId, qty }] });
    else {
      const idx = existing.items.findIndex(i => i.productId === productId);
      if (idx >= 0) existing.items[idx].qty += qty; else existing.items.push({ productId, qty });
      await carts.updateOne({ userId: u.id }, { $set: { items: existing.items } });
    }
    return json({ ok: true });
  }
  if (path === '/cart/update' && method === 'POST') {
    const u = await requireUser();
    const { productId, qty } = await request.json();
    const carts = await col('carts');
    const cart = await carts.findOne({ userId: u.id });
    if (!cart) return json({ ok: true });
    let items = cart.items;
    if (qty <= 0) items = items.filter(i => i.productId !== productId);
    else items = items.map(i => i.productId === productId ? { ...i, qty } : i);
    await carts.updateOne({ userId: u.id }, { $set: { items } });
    return json({ ok: true });
  }
  if (path === '/cart/remove' && method === 'POST') {
    const u = await requireUser();
    const { productId } = await request.json();
    const carts = await col('carts');
    const cart = await carts.findOne({ userId: u.id });
    if (!cart) return json({ ok: true });
    await carts.updateOne({ userId: u.id }, { $set: { items: cart.items.filter(i => i.productId !== productId) } });
    return json({ ok: true });
  }

  // --- WISHLIST ---
  if (path === '/wishlist' && method === 'GET') {
    const u = await getCurrentUser();
    if (!u) return json({ items: [] });
    const w = await (await col('wishlists')).findOne({ userId: u.id });
    const ids = w?.items || [];
    const prods = await (await col('products')).find({ id: { $in: ids } }).toArray();
    return json({ items: prods.map(({ _id, ...r }) => r) });
  }
  if (path === '/wishlist/toggle' && method === 'POST') {
    const u = await requireUser();
    const { productId } = await request.json();
    const ws = await col('wishlists');
    const w = await ws.findOne({ userId: u.id });
    if (!w) { await ws.insertOne({ userId: u.id, items: [productId] }); return json({ added: true }); }
    if (w.items.includes(productId)) {
      await ws.updateOne({ userId: u.id }, { $set: { items: w.items.filter(i => i !== productId) } });
      return json({ added: false });
    }
    await ws.updateOne({ userId: u.id }, { $set: { items: [...w.items, productId] } });
    return json({ added: true });
  }

  // --- COUPONS ---
  if (path === '/coupons/validate' && method === 'POST') {
    const { code, subtotal } = await request.json();
    const c = await (await col('coupons')).findOne({ code: (code || '').toUpperCase(), active: true });
    if (!c) return err('invalid coupon', 404);
    if ((c.minOrder || 0) > subtotal) return err(`minimum order ₹${c.minOrder}`);
    let discount = 0;
    if (c.discountPct) discount = Math.round((subtotal * c.discountPct) / 100);
    if (c.discountFlat) discount = c.discountFlat;
    return json({ code: c.code, discount, description: c.description });
  }
  if (path === '/admin/coupons' && method === 'GET') {
    await requireAdmin();
    const items = await (await col('coupons')).find({}).toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  if (path === '/admin/coupons' && method === 'POST') {
    await requireAdmin();
    const body = await request.json();
    const item = { id: uuid(), active: true, ...body, code: (body.code || '').toUpperCase() };
    await (await col('coupons')).insertOne(item);
    const { _id, ...r } = item;
    return json(r);
  }
  if (path.startsWith('/admin/coupons/') && method === 'DELETE') {
    await requireAdmin();
    await (await col('coupons')).deleteOne({ id: segments[2] });
    return json({ ok: true });
  }

  // --- ORDERS ---
  if (path === '/orders' && method === 'POST') {
    const u = await requireUser();
    const body = await request.json();
    const { address, couponCode, paymentMethod = 'COD', paymentDetails } = body;
    if (!address) return err('address required');
    const cart = await (await col('carts')).findOne({ userId: u.id });
    if (!cart || cart.items.length === 0) return err('cart empty');
    const products = await (await col('products')).find({ id: { $in: cart.items.map(i => i.productId) } }).toArray();
    const items = cart.items.map(it => {
      const p = products.find(x => x.id === it.productId);
      return { productId: p.id, name: p.name, image: p.image, price: p.price, qty: it.qty, total: p.price * it.qty, weight: p.weight || '', unit: p.unit || '' };
    });
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    let discount = 0;
    if (couponCode) {
      const c = await (await col('coupons')).findOne({ code: couponCode.toUpperCase(), active: true });
      if (c && subtotal >= (c.minOrder || 0)) {
        if (c.discountPct) discount = Math.round((subtotal * c.discountPct) / 100);
        if (c.discountFlat) discount = c.discountFlat;
      }
    }
    const tax = Math.round((subtotal - discount) * 0.05);
    // PIN-code distance-based delivery rate
    const dq = await quoteDelivery(address.pincode, subtotal);
    if (!dq.deliverable) return err(dq.message || 'Sorry, we cannot deliver to this PIN code.', 400);
    const shipping = dq.charge || 0;
    const total = subtotal - discount + tax + shipping;
    const id = 'DA' + Date.now().toString(36).toUpperCase() + uuid().slice(0, 4).toUpperCase();

    // Payment status logic
    let status, paymentVerified = false, paymentRecord = null;
    if (paymentMethod === 'UPI') {
      if (!paymentDetails || !paymentDetails.transactionId || !paymentDetails.screenshot) {
        return err('UPI transaction ID and screenshot required', 400);
      }
      status = 'payment_verification_pending';
      paymentRecord = {
        transactionId: String(paymentDetails.transactionId).trim(),
        screenshot: paymentDetails.screenshot, // base64 data URL
        submittedAt: new Date(),
      };
    } else {
      // COD
      status = 'placed';
    }

    const order = {
      id, userId: u.id, customer: { name: u.name, email: u.email },
      items, address, subtotal, discount, tax, shipping, total,
      couponCode: couponCode || null, status, paymentMethod, paymentVerified,
      paymentDetails: paymentRecord,
      deliveryQuote: dq,
      createdAt: new Date(),
      updates: [{ status, at: new Date() }],
    };
    await (await col('orders')).insertOne(order);
    await (await col('carts')).updateOne({ userId: u.id }, { $set: { items: [] } });
    const { _id, ...r } = order;
    return json(r);
  }
  if (path === '/orders' && method === 'GET') {
    const u = await requireUser();
    const items = await (await col('orders')).find({ userId: u.id }).sort({ createdAt: -1 }).toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  if (path.startsWith('/orders/') && method === 'GET') {
    const u = await requireUser();
    const id = segments[1];
    const o = await (await col('orders')).findOne({ id });
    if (!o) return err('not found', 404);
    if (o.userId !== u.id && u.role !== 'admin') return err('forbidden', 403);
    const { _id, ...r } = o;
    return json(r);
  }
  if (path.startsWith('/orders/') && segments[2] === 'cancel' && method === 'POST') {
    const u = await requireUser();
    const id = segments[1];
    const o = await (await col('orders')).findOne({ id });
    if (!o || o.userId !== u.id) return err('forbidden', 403);
    if (['shipped', 'delivered', 'cancelled'].includes(o.status)) return err('cannot cancel at this stage');
    await (await col('orders')).updateOne({ id }, { $set: { status: 'cancelled' }, $push: { updates: { status: 'cancelled', at: new Date() } } });
    return json({ ok: true });
  }
  if (path.startsWith('/orders/') && segments[2] === 'reorder' && method === 'POST') {
    const u = await requireUser();
    const o = await (await col('orders')).findOne({ id: segments[1] });
    if (!o || o.userId !== u.id) return err('forbidden', 403);
    const items = o.items.map(i => ({ productId: i.productId, qty: i.qty }));
    await (await col('carts')).updateOne({ userId: u.id }, { $set: { items } }, { upsert: true });
    return json({ ok: true });
  }
  // Per-item return requests
  if (path.startsWith('/orders/') && segments[2] === 'return' && method === 'POST') {
    const u = await requireUser();
    const orderId = segments[1];
    const productId = segments[3];
    const { reason, description, image } = await request.json();
    if (!reason) return err('return reason is required');
    if (!productId) return err('product is required');
    const orders = await col('orders');
    const o = await orders.findOne({ id: orderId });
    if (!o || o.userId !== u.id) return err('forbidden', 403);
    if (o.status !== 'delivered') return err('returns can only be requested for delivered orders');
    const item = o.items.find(i => i.productId === productId);
    if (!item) return err('item not found in this order', 404);
    if (item.returnRequest && ['pending', 'approved'].includes(item.returnRequest.status)) {
      return err('a return request already exists for this item');
    }
    const returnRequest = {
      reason, description: description || '', image: image || null,
      status: 'pending', refundStatus: 'not_initiated', adminNote: '',
      createdAt: new Date(), updatedAt: new Date(),
    };
    await orders.updateOne(
      { id: orderId, 'items.productId': productId },
      { $set: { 'items.$.returnRequest': returnRequest } }
    );
    return json({ ok: true, returnRequest });
  }
  if (path === '/admin/returns' && method === 'GET') {
    await requireAdmin();
    const orders = await (await col('orders')).find({ 'items.returnRequest': { $exists: true } }).sort({ createdAt: -1 }).toArray();
    const flattened = [];
    for (const o of orders) {
      for (const it of o.items) {
        if (it.returnRequest) {
          flattened.push({
            orderId: o.id, productId: it.productId, productName: it.name, productImage: it.image,
            qty: it.qty, itemTotal: it.total, customer: o.customer,
            ...it.returnRequest,
          });
        }
      }
    }
    flattened.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return json({ items: flattened });
  }
  if (path.startsWith('/admin/returns/') && method === 'PUT') {
    await requireAdmin();
    const orderId = segments[2];
    const productId = segments[3];
    const { status, refundStatus, replacementStatus, adminNote } = await request.json();
    const orders = await col('orders');
    const o = await orders.findOne({ id: orderId });
    if (!o) return err('order not found', 404);
    const item = o.items.find(i => i.productId === productId);
    if (!item || !item.returnRequest) return err('return request not found', 404);
    const set = { 'items.$.returnRequest.updatedAt': new Date() };
    if (status) set['items.$.returnRequest.status'] = status;
    if (refundStatus) set['items.$.returnRequest.refundStatus'] = refundStatus;
    if (replacementStatus !== undefined) set['items.$.returnRequest.replacementStatus'] = replacementStatus;
    if (adminNote !== undefined) set['items.$.returnRequest.adminNote'] = adminNote;
    await orders.updateOne({ id: orderId, 'items.productId': productId }, { $set: set });
    return json({ ok: true });
  }

  if (path.startsWith('/admin/orders/') && segments[3] === 'verify-payment' && method === 'POST') {
    await requireAdmin();
    const id = segments[2];
    const { action, reason } = await request.json();
    const o = await (await col('orders')).findOne({ id });
    if (!o) return err('not found', 404);
    if (o.paymentMethod !== 'UPI') return err('not a UPI order');
    if (action === 'approve') {
      await (await col('orders')).updateOne({ id }, { $set: { paymentVerified: true, status: 'confirmed', paymentVerifiedAt: new Date() }, $push: { updates: { status: 'payment_approved', at: new Date(), note: 'Payment verified by admin' } } });
      return json({ ok: true, status: 'confirmed' });
    } else if (action === 'reject') {
      await (await col('orders')).updateOne({ id }, { $set: { paymentVerified: false, status: 'payment_rejected', paymentRejectionReason: reason || 'Payment could not be verified' }, $push: { updates: { status: 'payment_rejected', at: new Date(), note: reason || 'Payment rejected' } } });
      return json({ ok: true, status: 'payment_rejected' });
    }
    return err('invalid action');
  }
  if (path === '/checkout/quote' && method === 'POST') {
    const u = await requireUser();
    const { couponCode } = await request.json();
    const cart = await (await col('carts')).findOne({ userId: u.id });
    if (!cart || !cart.items.length) return err('cart empty');
    const products = await (await col('products')).find({ id: { $in: cart.items.map(i => i.productId) } }).toArray();
    const items = cart.items.map(it => { const p = products.find(x => x.id === it.productId); return { name: p.name, qty: it.qty, total: p.price * it.qty }; });
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    let discount = 0, validCoupon = null;
    if (couponCode) {
      const c = await (await col('coupons')).findOne({ code: couponCode.toUpperCase(), active: true });
      if (c && subtotal >= (c.minOrder || 0)) {
        if (c.discountPct) discount = Math.round((subtotal * c.discountPct) / 100);
        if (c.discountFlat) discount = c.discountFlat;
        validCoupon = c.code;
      }
    }
    const tax = Math.round((subtotal - discount) * 0.05);
    // PIN-code distance-based delivery rate (best-effort: only when pincode supplied)
    let shipping = 0, deliveryQuote = null;
    if (body.pincode) {
      deliveryQuote = await quoteDelivery(body.pincode, subtotal);
      if (!deliveryQuote.deliverable) return json({ items, subtotal, discount, tax, shipping: 0, total: subtotal - discount + tax, couponCode: validCoupon, deliveryQuote });
      shipping = deliveryQuote.charge || 0;
    }
    const total = subtotal - discount + tax + shipping;
    return json({ items, subtotal, discount, tax, shipping, total, couponCode: validCoupon, deliveryQuote });
  }

  if (path === '/admin/orders' && method === 'GET') {
    await requireAdmin();
    const items = await (await col('orders')).find({}).sort({ createdAt: -1 }).toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  // Dedicated endpoint that returns ONLY orders that are awaiting UPI payment verification.
  if (path === '/admin/payments' && method === 'GET') {
    await requireAdmin();
    const items = await (await col('orders'))
      .find({ paymentMethod: 'UPI' })
      .sort({ createdAt: -1 })
      .toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  if (path.startsWith('/admin/orders/') && method === 'PUT') {
    await requireAdmin();
    const id = segments[2];
    const { status } = await request.json();
    await (await col('orders')).updateOne({ id }, { $set: { status }, $push: { updates: { status, at: new Date() } } });
    return json({ ok: true });
  }
  if (path === '/admin/users' && method === 'GET') {
    await requireAdmin();
    const items = await (await col('users')).find({}).toArray();
    return json({ items: items.map(({ _id, password, ...r }) => r) });
  }
  if (path === '/admin/reviews' && method === 'GET') {
    await requireAdmin();
    const items = await (await col('reviews')).find({}).sort({ createdAt: -1 }).toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  if (path.startsWith('/admin/reviews/') && method === 'DELETE') {
    await requireAdmin();
    await (await col('reviews')).deleteOne({ id: segments[2] });
    return json({ ok: true });
  }
  if (path === '/admin/stats' && method === 'GET') {
    await requireAdmin();
    const orders = await (await col('orders')).find({}).toArray();
    const products = await (await col('products')).estimatedDocumentCount();
    const users = await (await col('users')).estimatedDocumentCount();
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    // Last 7 days sales
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const dayOrders = orders.filter(o => new Date(o.createdAt) >= d && new Date(o.createdAt) < next);
      days.push({ date: d.toISOString().slice(5, 10), revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0), orders: dayOrders.length });
    }
    const byStatus = orders.reduce((a, o) => ((a[o.status] = (a[o.status] || 0) + 1), a), {});
    return json({ revenue, orders: orders.length, products, users, byStatus, days });
  }

  if (path === '/reviews' && method === 'POST') {
    const u = await requireUser();
    const { productId, rating, comment } = await request.json();
    if (!productId || !rating) return err('productId and rating required');
    const review = { id: uuid(), productId, userId: u.id, userName: u.name, rating, comment: comment || '', createdAt: new Date() };
    await (await col('reviews')).insertOne(review);
    const all = await (await col('reviews')).find({ productId }).toArray();
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await (await col('products')).updateOne({ id: productId }, { $set: { rating: Math.round(avg * 10) / 10, ratingCount: all.length } });
    return json(review);
  }

  if (path === '/contact' && method === 'POST') {
    const body = await request.json();
    await (await col('contact_messages')).insertOne({ id: uuid(), ...body, createdAt: new Date() });
    return json({ ok: true });
  }
  if (path === '/newsletter' && method === 'POST') {
    const { email } = await request.json();
    if (!email) return err('email required');
    await (await col('newsletter')).updateOne({ email }, { $set: { email, createdAt: new Date() } }, { upsert: true });
    return json({ ok: true });
  }

  // ---------- DELIVERY (PIN-code distance based) ----------
  // Settings doc { storePincode, freeDeliveryThreshold, slabs, fallbackPolicy }
  // slabs is sorted, each: { fromKm, toKm, charge, label }
  // fallbackPolicy: 'block' (default) | 'flat:<rs>'
  // pincodes collection: { pincode, distanceKm, deliverable, city, state }
  const DEFAULT_DELIVERY = {
    storePincode: '638502',
    freeDeliveryThreshold: 999,
    slabs: [
      { fromKm: 0, toKm: 5, charge: 30, label: '0–5 KM' },
      { fromKm: 5, toKm: 10, charge: 50, label: '5–10 KM' },
      { fromKm: 10, toKm: 15, charge: 70, label: '10–15 KM' },
      { fromKm: 15, toKm: 20, charge: 100, label: '15–20 KM' },
    ],
    notDeliverableLabel: 'Beyond 20 KM',
    fallbackPolicy: 'block',
  };
  async function getDeliverySettings() {
    const doc = await (await col('delivery_settings')).findOne({ key: 'main' });
    return { ...DEFAULT_DELIVERY, ...(doc?.value || {}) };
  }
  async function quoteDelivery(pincode, subtotal) {
    const s = await getDeliverySettings();
    const trimmed = (pincode || '').trim();
    let pin = await (await col('pincodes')).findOne({ pincode: trimmed });
    // Same pincode as store → 0 km
    if (!pin && trimmed === s.storePincode) {
      pin = { pincode: trimmed, distanceKm: 0, deliverable: true, city: 'Store location' };
    }
    if (!pin) {
      if (s.fallbackPolicy && s.fallbackPolicy.startsWith('flat:')) {
        const charge = Number(s.fallbackPolicy.split(':')[1]) || 0;
        return { deliverable: true, distanceKm: null, charge, slab: { label: 'Outside zones — flat rate' }, message: 'Delivery charge based on flat fallback rate.' };
      }
      return { deliverable: false, message: `PIN ${trimmed || '—'} is outside our delivery zone. Please contact support for special arrangements.` };
    }
    if (pin.deliverable === false) {
      return { deliverable: false, distanceKm: pin.distanceKm, message: `Sorry — we don't currently deliver to ${pin.city || pin.pincode}.` };
    }
    const slab = (s.slabs || []).find(sl => pin.distanceKm >= sl.fromKm && pin.distanceKm < sl.toKm);
    if (!slab) {
      return { deliverable: false, distanceKm: pin.distanceKm, message: `${pin.city || pin.pincode} is ${pin.distanceKm} km from our store — ${s.notDeliverableLabel || 'beyond delivery range'}.` };
    }
    const freeFromSubtotal = (s.freeDeliveryThreshold || 0) > 0 && Number(subtotal || 0) >= s.freeDeliveryThreshold;
    return {
      deliverable: true,
      distanceKm: pin.distanceKm,
      city: pin.city, state: pin.state,
      slab,
      charge: freeFromSubtotal ? 0 : slab.charge,
      free: freeFromSubtotal,
      message: freeFromSubtotal ? `FREE delivery on orders above ₹${s.freeDeliveryThreshold}.` : `${pin.distanceKm} km from store — ${slab.label} slab.`,
    };
  }

  if (path === '/delivery/quote' && method === 'GET') {
    const pincode = url.searchParams.get('pincode');
    const subtotal = Number(url.searchParams.get('subtotal') || 0);
    if (!pincode) return err('pincode required');
    const q = await quoteDelivery(pincode, subtotal);
    return json(q);
  }
  if (path === '/admin/delivery' && method === 'GET') {
    await requireAdmin();
    const s = await getDeliverySettings();
    const pincodes = await (await col('pincodes')).find({}).sort({ distanceKm: 1, pincode: 1 }).limit(1000).toArray();
    return json({ settings: s, pincodes: pincodes.map(({ _id, ...r }) => r) });
  }
  if (path === '/admin/delivery' && method === 'PUT') {
    await requireAdmin();
    const body = await request.json();
    await (await col('delivery_settings')).updateOne(
      { key: 'main' },
      { $set: { key: 'main', value: body, updatedAt: new Date() } },
      { upsert: true },
    );
    return json({ ok: true });
  }
  if (path === '/admin/delivery/pincodes' && method === 'POST') {
    await requireAdmin();
    const body = await request.json();
    // Accept either a single { pincode, distanceKm, deliverable, city, state }
    // or { items: [...] } for bulk insert.
    const items = Array.isArray(body.items) ? body.items : [body];
    const ops = items
      .filter(p => p && p.pincode)
      .map(p => ({
        updateOne: {
          filter: { pincode: String(p.pincode).trim() },
          update: { $set: {
            pincode: String(p.pincode).trim(),
            distanceKm: Number(p.distanceKm) || 0,
            deliverable: p.deliverable !== false,
            city: p.city || '',
            state: p.state || '',
            updatedAt: new Date(),
          } },
          upsert: true,
        },
      }));
    if (!ops.length) return err('no pincode rows');
    const result = await (await col('pincodes')).bulkWrite(ops);
    return json({ ok: true, modified: result.modifiedCount, upserted: result.upsertedCount });
  }
  if (path.startsWith('/admin/delivery/pincodes/') && method === 'DELETE') {
    await requireAdmin();
    await (await col('pincodes')).deleteOne({ pincode: segments[3] });
    return json({ ok: true });
  }

  // ---------- SITE SETTINGS / CMS ----------
  // Public endpoint: returns the editable site settings & content blocks.
  // Falls back to sensible defaults from /lib/company.js if nothing has been
  // saved yet. The admin UI mutates these via PUT /admin/settings.
  if (path === '/settings' && method === 'GET') {
    const s = await (await col('site_settings')).findOne({ key: 'main' });
    const { _id, ...rest } = s || {};
    return json(rest.value || {});
  }
  if (path === '/admin/settings' && method === 'GET') {
    await requireAdmin();
    const s = await (await col('site_settings')).findOne({ key: 'main' });
    const { _id, ...rest } = s || {};
    return json(rest.value || {});
  }
  if (path === '/admin/settings' && method === 'PUT') {
    await requireAdmin();
    const body = await request.json();
    await (await col('site_settings')).updateOne(
      { key: 'main' },
      { $set: { key: 'main', value: body, updatedAt: new Date() } },
      { upsert: true },
    );
    return json({ ok: true });
  }

  // Banners (homepage hero slides)
  if (path === '/banners' && method === 'GET') {
    const items = await (await col('banners')).find({ active: { $ne: false } }).sort({ order: 1 }).toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  if (path === '/admin/banners' && method === 'GET') {
    await requireAdmin();
    const items = await (await col('banners')).find({}).sort({ order: 1 }).toArray();
    return json({ items: items.map(({ _id, ...r }) => r) });
  }
  if (path === '/admin/banners' && method === 'POST') {
    await requireAdmin();
    const body = await request.json();
    const item = { id: uuid(), order: 999, active: true, ...body, createdAt: new Date() };
    await (await col('banners')).insertOne(item);
    const { _id, ...r } = item;
    return json(r);
  }
  if (path.startsWith('/admin/banners/') && method === 'PUT') {
    await requireAdmin();
    const id = segments[2];
    const body = await request.json();
    delete body._id; delete body.id;
    await (await col('banners')).updateOne({ id }, { $set: body });
    return json({ ok: true });
  }
  if (path.startsWith('/admin/banners/') && method === 'DELETE') {
    await requireAdmin();
    await (await col('banners')).deleteOne({ id: segments[2] });
    return json({ ok: true });
  }

  // ---------- ADMIN USER MANAGEMENT ----------
  if (path.startsWith('/admin/users/') && segments[3] === 'details' && method === 'GET') {
    await requireAdmin();
    const userId = segments[2];
    const users = await col('users');
    const u = await users.findOne({ id: userId });
    if (!u) return err('user not found', 404);
    const { password, _id, ...userPublic } = u;
    const orders = await (await col('orders')).find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
    const addresses = await (await col('addresses')).find({ userId }).toArray();
    return json({
      user: userPublic,
      orders: orders.map(({ _id, ...r }) => r),
      addresses: addresses.map(({ _id, ...r }) => r),
    });
  }
  if (path.startsWith('/admin/users/') && method === 'PUT') {
    await requireAdmin();
    const userId = segments[2];
    const me = await getCurrentUser();
    const { name, email, role, active, newPassword } = await request.json();
    const update = {};
    if (typeof name === 'string') update.name = name;
    if (typeof email === 'string') update.email = email;
    if (typeof role === 'string') {
      if (me.id === userId && role !== 'admin') return err('cannot remove your own admin role', 400);
      update.role = role;
    }
    if (typeof active === 'boolean') {
      if (me.id === userId && active === false) return err('cannot deactivate yourself', 400);
      update.active = active;
    }
    if (newPassword) {
      if (newPassword.length < 6) return err('password must be 6+ characters');
      update.password = hashPassword(newPassword);
      update.passwordResetAt = new Date();
    }
    if (!Object.keys(update).length) return err('nothing to update');
    await (await col('users')).updateOne({ id: userId }, { $set: update });
    return json({ ok: true });
  }
  if (path.startsWith('/admin/users/') && method === 'DELETE') {
    await requireAdmin();
    const userId = segments[2];
    const me = await getCurrentUser();
    if (me.id === userId) return err('cannot delete yourself', 400);
    await (await col('users')).deleteOne({ id: userId });
    await (await col('carts')).deleteMany({ userId });
    await (await col('addresses')).deleteMany({ userId });
    await (await col('wishlists')).deleteMany({ userId });
    return json({ ok: true });
  }

  return err('not found: ' + method + ' ' + path, 404);
}

export async function GET(req, ctx) { const { path = [] } = await ctx.params; try { return await handle('GET', path, req); } catch (e) { console.error(e); return err(e.message || 'error', e.message === 'UNAUTHORIZED' ? 401 : e.message === 'FORBIDDEN' ? 403 : 500); } }
export async function POST(req, ctx) { const { path = [] } = await ctx.params; try { return await handle('POST', path, req); } catch (e) { console.error(e); return err(e.message || 'error', e.message === 'UNAUTHORIZED' ? 401 : e.message === 'FORBIDDEN' ? 403 : 500); } }
export async function PUT(req, ctx) { const { path = [] } = await ctx.params; try { return await handle('PUT', path, req); } catch (e) { console.error(e); return err(e.message || 'error', e.message === 'UNAUTHORIZED' ? 401 : e.message === 'FORBIDDEN' ? 403 : 500); } }
export async function DELETE(req, ctx) { const { path = [] } = await ctx.params; try { return await handle('DELETE', path, req); } catch (e) { console.error(e); return err(e.message || 'error', e.message === 'UNAUTHORIZED' ? 401 : e.message === 'FORBIDDEN' ? 403 : 500); } }

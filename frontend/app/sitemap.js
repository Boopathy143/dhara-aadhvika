// Dynamic sitemap.xml — pulls all live products + categories from MongoDB.
// Uses the public REST endpoint to stay backend-agnostic and avoid duplicating
// the Mongo connection logic. Static marketing routes are listed explicitly.
const STATIC_ROUTES = [
  '', '/products', '/about', '/our-story', '/our-mission', '/why-choose-us',
  '/quality-promise', '/contact', '/faq', '/support', '/login', '/register',
  '/shipping-policy', '/return-policy', '/refund-policy', '/cancellation-policy',
  '/privacy', '/terms',
];

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://dharaaadhvika.in';
  const now = new Date();
  const urls = STATIC_ROUTES.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : p === '/products' ? 0.9 : 0.6,
  }));

  // Pull products and categories so they appear in the sitemap dynamically.
  try {
    const [pRes, cRes] = await Promise.all([
      fetch(`${base}/api/products?limit=200`, { cache: 'no-store' }),
      fetch(`${base}/api/categories`, { cache: 'no-store' }),
    ]);
    if (pRes.ok) {
      const { items = [] } = await pRes.json();
      for (const p of items) {
        urls.push({
          url: `${base}/products/${p.id}`,
          lastModified: p.createdAt ? new Date(p.createdAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
    if (cRes.ok) {
      const items = await cRes.json();
      for (const c of items) {
        urls.push({
          url: `${base}/products?category=${c.slug || c.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch (e) {
    console.error('sitemap fetch failed', e.message);
  }
  return urls;
}

// Dynamic robots.txt — Next.js convention. Disallows admin/checkout/account.
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dharaaadhvika.in';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/checkout', '/orders', '/cart', '/wishlist', '/profile', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

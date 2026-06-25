'use client';
import Link from 'next/link';
import useSWR from 'swr';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContentPage({ title, subtitle, sections = [], cta, cmsKey }) {
  // If a CMS key is given, fetch settings and use the admin-edited content
  // (if non-empty) instead of the hard-coded default sections. This lets the
  // admin completely override any policy page via Site Settings without code.
  const { data: settings } = useSWR(cmsKey ? '/api/settings' : null);
  const cmsContent = cmsKey ? settings?.content?.[cmsKey] : null;
  const useCMS = typeof cmsContent === 'string' && cmsContent.trim().length > 0;

  return (
    <>
      <Header />
      <main className="bg-stone-50 dark:bg-stone-950">
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-amber-700 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-200 font-semibold">Dhara Aadhvika</div>
            <h1 className="text-3xl md:text-5xl font-bold mt-2 leading-tight">{title}</h1>
            {subtitle && <p className="mt-3 text-stone-100/90 max-w-2xl text-lg">{subtitle}</p>}
          </div>
        </div>
        <article className="container mx-auto px-4 py-12 max-w-3xl prose prose-stone dark:prose-invert">
          {useCMS ? (
            <section className="mb-8" data-testid={`cms-content-${cmsKey}`}>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{cmsContent}</p>
            </section>
          ) : (
            sections.map((s, i) => (
              <section key={i} className="mb-8">
                {s.heading && <h2 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300 mb-3">{s.heading}</h2>}
                {Array.isArray(s.content) ? (
                  <ul className="space-y-2 text-foreground/90">{s.content.map((c, j) => <li key={j} className="leading-relaxed">{c}</li>)}</ul>
                ) : (
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{s.content}</p>
                )}
              </section>
            ))
          )}
          {cta && <div className="mt-10 p-6 rounded-xl bg-emerald-700/5 border border-emerald-700/20"><div className="font-semibold text-emerald-800 dark:text-emerald-300">{cta.title}</div><p className="text-sm mt-1 text-muted-foreground">{cta.text}</p><Link href={cta.href} className="inline-block mt-3 px-4 py-2 rounded-md bg-emerald-700 text-white text-sm font-medium">{cta.label}</Link></div>}
        </article>
      </main>
      <Footer />
    </>
  );
}

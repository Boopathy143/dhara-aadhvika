'use client';
import useSWR from 'swr';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { Sprout, Leaf, Wheat, Soup, Candy, Droplet, Cookie, ShoppingBasket, Sparkles, ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Star, HeartPulse, Award, Sun, TreePine } from 'lucide-react';

const ICONS = { Sprout, Leaf, Wheat, Soup, Candy, Droplet, Cookie, ShoppingBasket, Sparkles };

function Section({ title, subtitle, link, children }) {
  return (
    <section className="container mx-auto px-4 mt-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          {subtitle && <div className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-1">{subtitle}</div>}
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        </div>
        {link && <Link href={link} className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {children}
    </section>
  );
}

function Grid({ apiUrl, limit = 8 }) {
  const { data, isLoading } = useSWR(apiUrl);
  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}</div>;
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{(data?.items || []).slice(0, limit).map(p => <ProductCard key={p.id} p={p} />)}</div>;
}

const REVIEWS = [
  { name: 'Priya Krishnan', city: 'Chennai', text: 'Their cold-pressed sesame oil reminded me of my grandmother’s kitchen. Absolutely pure and aromatic. Switched our family entirely to Dhara Aadhvika.', rating: 5 },
  { name: 'Rajesh Iyer', city: 'Bangalore', text: 'The five-millet pack and sathu maavu have been game-changers for our toddler’s nutrition. Quality is unmatched.', rating: 5 },
  { name: 'Anita Reddy', city: 'Hyderabad', text: 'Forest honey is genuinely raw — you can see the pollen settling at the bottom. This is the real deal.', rating: 5 },
  { name: 'Vikram Mehta', city: 'Mumbai', text: 'A2 ghee with that authentic grainy texture and bilona aroma. My morning rotis taste like home.', rating: 5 },
];

const HEALTH = [
  { icon: HeartPulse, title: 'Heart Health', text: 'Wood-pressed oils + millets help maintain healthy cholesterol.' },
  { icon: Sprout, title: 'Gut Friendly', text: 'High fibre grains, sprouted powders and natural probiotics.' },
  { icon: Award, title: 'Immunity', text: 'Moringa, ashwagandha, raw honey — nature’s pharmacy.' },
  { icon: TreePine, title: 'Sustainable', text: 'Direct from farmers, zero chemicals, eco-friendly packaging.' },
];

const CERTS = ['FSSAI Certified', '100% Organic', 'Lab Tested', 'Wood-Pressed', 'No Preservatives', 'No Adulteration'];

export default function HomePage() {
  const { data: cats = [] } = useSWR('/api/categories');
  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 mt-4"><HeroSlider /></div>

        <section className="container mx-auto px-4 mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, t: 'Free Shipping', d: 'On orders ₹999+' },
              { icon: RotateCcw, t: 'Easy Returns', d: '7-day policy' },
              { icon: ShieldCheck, t: 'Lab Verified', d: 'Quality assured' },
              { icon: Headphones, t: 'Real Support', d: 'WhatsApp & call' },
            ].map(({ icon: I, t, d }) => (
              <div key={t} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-emerald-600 transition">
                <div className="h-10 w-10 grid place-items-center rounded-lg bg-emerald-700/10 text-emerald-700"><I className="h-5 w-5" /></div>
                <div><div className="font-semibold text-sm">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
              </div>
            ))}
          </div>
        </section>

        <Section title="Shop by Category" subtitle="Pure goodness, sorted">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {cats.map(c => {
              const Icon = ICONS[c.icon] || Leaf;
              return (
                <Link key={c.id} href={`/products?category=${c.slug}`} className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-emerald-700 hover:shadow-md transition">
                  <div className="h-14 w-14 grid place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-amber-600 text-white group-hover:scale-110 transition"><Icon className="h-6 w-6" /></div>
                  <span className="text-xs font-medium text-center leading-tight">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </Section>

        <Section title="Featured Picks" subtitle="Hand-curated for you" link="/products?featured=1"><Grid apiUrl="/api/products?featured=1&limit=8" /></Section>
        <Section title="Best Sellers" subtitle="Loved by families" link="/products?bestSeller=1"><Grid apiUrl="/api/products?bestSeller=1&limit=8" /></Section>

        <section className="container mx-auto px-4 mt-16">
          <div className="rounded-2xl overflow-hidden relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-amber-700 text-white p-10 md:p-14">
            <div className="absolute right-0 top-0 opacity-10"><Leaf className="h-72 w-72 -rotate-12" /></div>
            <div className="relative max-w-2xl">
              <div className="text-xs uppercase tracking-[0.25em] text-amber-200 font-semibold mb-2">Why Dhara Aadhvika</div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">Food that nourishes, traditions that heal.</h2>
              <p className="mt-4 text-stone-100 max-w-xl">Every product is sourced from small farmers, processed in age-old ways, and tested for purity. No chemicals, no shortcuts — just real food.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">{HEALTH.map(({ icon: I, title, text }) => (
                <div key={title} className="bg-white/10 backdrop-blur rounded-lg p-4"><I className="h-6 w-6 text-amber-200" /><div className="font-semibold mt-2">{title}</div><div className="text-xs text-stone-200 mt-1">{text}</div></div>
              ))}</div>
            </div>
          </div>
        </section>

        <Section title="New Arrivals" subtitle="Fresh on our shelves" link="/products?new=1"><Grid apiUrl="/api/products?new=1&limit=8" /></Section>
        <Section title="Trending Now" subtitle="What everyone's loving" link="/products?trending=1"><Grid apiUrl="/api/products?trending=1&limit=8" /></Section>

        <Section title="From our family to yours" subtitle="Customer love">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{REVIEWS.map((r, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex gap-0.5">{Array(r.rating).fill(0).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-500 text-amber-500" />)}</div>
              <p className="mt-3 text-sm leading-relaxed">“{r.text}”</p>
              <div className="mt-4 text-sm font-semibold">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.city}</div>
            </div>
          ))}</div>
        </Section>

        <section className="container mx-auto px-4 mt-16">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold text-center mb-3">Trust & Certifications</div>
            <div className="flex flex-wrap justify-center gap-3">{CERTS.map(c => (
              <span key={c} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700/5 border border-emerald-700/20 text-emerald-800 dark:text-emerald-300 text-sm font-medium"><Sparkles className="h-3.5 w-3.5" />{c}</span>
            ))}</div>
          </div>
        </section>

        <section className="container mx-auto px-4 mt-16">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-amber-700 p-8 md:p-12 text-white">
            <div className="max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-bold">Join the Dhara family</h3>
              <p className="mt-2 opacity-90">Recipes from grandma, wellness tips, exclusive offers — right to your inbox. No spam, ever.</p>
              <form className="mt-5 flex flex-col sm:flex-row gap-3 max-w-md" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="your@email.com" className="flex-1 h-11 px-4 rounded-lg text-foreground bg-white" />
                <button type="button" className="h-11 px-6 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800">Subscribe</button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

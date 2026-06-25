'use client';
import { Suspense, useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { data: cats = [] } = useSWR('/api/categories');
  const { data: brands = [] } = useSWR('/api/brands');
  const category = sp.get('category') || '';
  const brand = sp.get('brand') || '';
  const q = sp.get('q') || '';
  const sort = sp.get('sort') || 'newest';
  const minRating = sp.get('minRating') || '';
  const [price, setPrice] = useState([0, 2000]);
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [category, brand, q, sort, minRating]);

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (brand) params.set('brand', brand);
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);
  if (minRating) params.set('minRating', minRating);
  ['featured', 'new', 'bestSeller', 'trending'].forEach(k => { if (sp.get(k)) params.set(k, '1'); });
  params.set('minPrice', String(price[0]));
  params.set('maxPrice', String(price[1]));
  params.set('page', String(page));
  params.set('limit', '12');

  const { data, isLoading } = useSWR(`/api/products?${params.toString()}`);
  const setParam = (k, v) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v); else next.delete(k);
    router.push(`/products?${next.toString()}`);
  };
  const clearAll = () => router.push('/products');

  const activeCat = cats.find(c => c.slug === category);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        {activeCat && (<div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-amber-700 text-white"><div className="text-xs uppercase tracking-[0.2em] opacity-90">Category</div><h1 className="text-3xl font-bold mt-1">{activeCat.name}</h1>{activeCat.tagline && <p className="opacity-90 mt-1">{activeCat.tagline}</p>}</div>)}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start lg:max-h-[calc(100vh-9rem)] lg:overflow-auto pr-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold"><Filter className="h-4 w-4" />Filters</div>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7"><X className="h-3 w-3 mr-1" />Clear</Button>
            </div>
            <div>
              <div className="font-medium mb-2 text-sm">Category</div>
              <div className="space-y-2">{cats.map(c => (<label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={category === c.slug} onCheckedChange={(v) => setParam('category', v ? c.slug : '')} />{c.name}</label>))}</div>
            </div>
            <div>
              <div className="font-medium mb-2 text-sm">Brand</div>
              <div className="space-y-2">{brands.map(b => (<label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={brand === b.id} onCheckedChange={(v) => setParam('brand', v ? b.id : '')} />{b.name}</label>))}</div>
            </div>
            <div>
              <div className="font-medium mb-2 text-sm">Price Range</div>
              <Slider value={price} onValueChange={setPrice} min={0} max={2000} step={50} />
              <div className="text-xs text-muted-foreground mt-2">₹{price[0].toLocaleString('en-IN')} — ₹{price[1].toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="font-medium mb-2 text-sm">Minimum Rating</div>
              <div className="space-y-2">{[4, 3, 2].map(r => (<label key={r} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={minRating === String(r)} onCheckedChange={(v) => setParam('minRating', v ? String(r) : '')} />{r}+ stars</label>))}</div>
            </div>
          </aside>
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                {!activeCat && <h1 className="text-2xl font-bold">{q ? `Results for "${q}"` : 'All Products'}</h1>}
                <div className="text-sm text-muted-foreground">{data?.total ?? 0} products found</div>
              </div>
              <Select value={sort} onValueChange={(v) => setParam('sort', v === 'newest' ? '' : v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="discount">Biggest Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}</div>) : (data?.items?.length || 0) === 0 ? (<div className="text-center py-20 text-muted-foreground">No products match your filters.</div>) : (<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{data.items.map(p => <ProductCard key={p.id} p={p} />)}</div>)}
            {data?.pages > 1 && (<div className="flex items-center justify-center gap-2 mt-8"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-sm">Page {page} of {data.pages}</span><Button variant="outline" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</Button></div>)}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<div className="p-8">Loading…</div>}><Inner /></Suspense>;
}

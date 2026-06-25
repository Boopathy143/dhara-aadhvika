'use client';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { formatPack } from '@/lib/format';

export default function ProductCard({ p }) {
  const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
  const addToCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const res = await fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, qty: 1 }) });
    if (!res.ok) { toast.error('Please sign in to add to cart'); return; }
    toast.success('Added to cart'); mutate('/api/cart');
  };
  const toggleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const res = await fetch('/api/wishlist/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id }) });
    if (!res.ok) { toast.error('Please sign in'); return; }
    const d = await res.json();
    toast.success(d.added ? 'Added to wishlist' : 'Removed from wishlist'); mutate('/api/wishlist');
  };
  return (
    <Card className="group overflow-hidden border-border/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card">
      <Link href={`/products/${p.id}`}>
        <div className="relative aspect-square bg-stone-50 dark:bg-stone-900 overflow-hidden">
          <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
          {discount > 0 && <span className="absolute top-2 left-2 bg-emerald-700 text-white text-xs font-semibold px-2 py-1 rounded">{discount}% OFF</span>}
          {p.isBestSeller && <span className="absolute top-2 left-2 mt-7 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Best Seller</span>}
          <button onClick={toggleWishlist} className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-background/85 backdrop-blur hover:bg-background shadow"><Heart className="h-4 w-4" /></button>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium line-clamp-2 min-h-[2.5rem] text-sm">{p.name}</h3>
          {formatPack(p) && <p className="text-xs text-muted-foreground" data-testid={`product-card-pack-${p.id}`}>{formatPack(p)}</p>}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 bg-emerald-700 text-white px-1.5 py-0.5 rounded"><Star className="h-3 w-3 fill-white" />{p.rating}</span>
            <span className="text-muted-foreground">({p.ratingCount})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">₹{p.price.toLocaleString('en-IN')}</span>
            {p.mrp > p.price && <span className="text-xs text-muted-foreground line-through">₹{p.mrp.toLocaleString('en-IN')}</span>}
          </div>
          <Button onClick={addToCart} className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800" size="sm">Add to Cart</Button>
        </CardContent>
      </Link>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-secondary/60" />
      <div className="p-4 space-y-2"><div className="h-4 bg-secondary/60 rounded" /><div className="h-4 bg-secondary/60 rounded w-2/3" /><div className="h-6 bg-secondary/60 rounded w-1/2" /></div>
    </div>
  );
}

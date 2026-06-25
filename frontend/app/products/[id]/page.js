'use client';
import { use, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Star, Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw, Minus, Plus, Sprout, Award, Leaf, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetails({ params }) {
  const { id } = use(params);
  const { data, isLoading } = useSWR(`/api/products/${id}`);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  if (isLoading || !data) return <><Header /><div className="container mx-auto p-8 animate-pulse"><div className="grid md:grid-cols-2 gap-8"><div className="aspect-square bg-secondary/60 rounded-xl" /><div className="space-y-3"><div className="h-8 bg-secondary/60 rounded w-3/4" /><div className="h-6 bg-secondary/60 rounded w-1/2" /><div className="h-24 bg-secondary/60 rounded" /></div></div></div><Footer /></>;
  const p = data.product;
  const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);

  const addToCart = async () => {
    const res = await fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, qty }) });
    if (!res.ok) { toast.error('Please sign in to add to cart'); return; }
    toast.success('Added to cart'); mutate('/api/cart');
  };
  const buyNow = async () => { await addToCart(); window.location.href = '/checkout'; };
  const toggleWishlist = async () => {
    const res = await fetch('/api/wishlist/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id }) });
    if (!res.ok) { toast.error('Please sign in'); return; }
    const d = await res.json(); toast.success(d.added ? 'Added to wishlist' : 'Removed from wishlist'); mutate('/api/wishlist');
  };
  const submitReview = async () => {
    const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, rating: reviewRating, comment: reviewText }) });
    if (!res.ok) { toast.error('Please sign in to leave a review'); return; }
    toast.success('Review submitted'); setReviewText(''); mutate(`/api/products/${id}`);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-50 dark:bg-stone-900 cursor-zoom-in border border-border" onMouseEnter={() => setZoom(true)} onMouseLeave={() => setZoom(false)}>
            <img src={p.image} alt={p.name} className={`h-full w-full object-cover transition-transform duration-300 ${zoom ? 'scale-150' : 'scale-100'}`} />
            {discount > 0 && <span className="absolute top-3 left-3 bg-emerald-700 text-white text-sm font-bold px-3 py-1.5 rounded">{discount}% OFF</span>}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-700" /><span className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-semibold">100% Organic • Village Sourced</span></div>
            <h1 className="text-2xl md:text-3xl font-bold">{p.name}</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 bg-emerald-700 text-white text-sm px-2 py-0.5 rounded"><Star className="h-3.5 w-3.5 fill-white" />{p.rating}</span>
              <span className="text-sm text-muted-foreground">{p.ratingCount} ratings • {data.reviews.length} reviews</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">₹{p.price.toLocaleString('en-IN')}</span>
              {p.mrp > p.price && <><span className="text-base text-muted-foreground line-through">₹{p.mrp.toLocaleString('en-IN')}</span><span className="text-emerald-700 font-semibold">{discount}% off</span></>}
            </div>
            <p className={`text-sm font-medium ${p.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{p.stock > 0 ? `In Stock (${p.stock} available)` : 'Out of Stock'}</p>
            {p.weight && <p className="text-sm"><span className="text-muted-foreground">Pack size:</span> <span className="font-medium">{p.weight}</span></p>}
            <p className="text-muted-foreground leading-relaxed">{p.description}</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border border-border rounded-md">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="h-9 w-9 grid place-items-center"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(p.stock, q + 1))} className="h-9 w-9 grid place-items-center"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={addToCart} disabled={p.stock === 0} className="bg-emerald-700 hover:bg-emerald-800"><ShoppingCart className="h-4 w-4 mr-2" />Add to Cart</Button>
              <Button size="lg" onClick={buyNow} disabled={p.stock === 0} className="bg-gradient-to-r from-emerald-700 to-amber-700 text-white hover:opacity-90">Buy Now</Button>
              <Button size="lg" variant="outline" onClick={toggleWishlist}><Heart className="h-4 w-4 mr-2" />Wishlist</Button>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs"><Truck className="h-4 w-4 text-emerald-700" />Free shipping ₹999+</div>
              <div className="flex items-center gap-2 text-xs"><RotateCcw className="h-4 w-4 text-emerald-700" />7-day returns</div>
              <div className="flex items-center gap-2 text-xs"><ShieldCheck className="h-4 w-4 text-emerald-700" />Lab verified</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-10">
          <TabsList><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="specs">Specifications</TabsTrigger><TabsTrigger value="reviews">Reviews ({data.reviews.length})</TabsTrigger></TabsList>
          <TabsContent value="details"><Card><CardContent className="p-6 space-y-4">
            {p.keyFeatures?.length > 0 && <div><div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Key Features</div><ul className="mt-2 space-y-1.5">{p.keyFeatures.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-700 shrink-0" />{f}</li>))}</ul></div>}
            {p.ingredients && <div><div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300"><Sprout className="h-4 w-4" />Ingredients</div><p className="text-sm text-muted-foreground mt-1">{p.ingredients}</p></div>}
            {p.benefits && <div><div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300"><Award className="h-4 w-4" />Benefits</div><p className="text-sm text-muted-foreground mt-1">{p.benefits}</p></div>}
            {p.nutrition && <div><div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">Nutrition</div><p className="text-sm text-muted-foreground mt-1">{p.nutrition}</p></div>}
          </CardContent></Card></TabsContent>
          <TabsContent value="specs"><Card><CardContent className="p-5 space-y-5">
            <dl className="grid sm:grid-cols-2 gap-3">{Object.entries(p.specs || {}).map(([k, v]) => (<div key={k} className="flex justify-between border-b border-border py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>))}</dl>
            {Object.keys(p.additionalInfo || {}).length > 0 && (
              <div>
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Additional Information</div>
                <dl className="grid sm:grid-cols-2 gap-3">{Object.entries(p.additionalInfo).map(([k, v]) => (<div key={k} className="flex justify-between border-b border-border py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>))}</dl>
              </div>
            )}
          </CardContent></Card></TabsContent>
          <TabsContent value="reviews"><Card><CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">{[1,2,3,4,5].map(n => <button key={n} onClick={() => setReviewRating(n)}><Star className={`h-5 w-5 ${n <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} /></button>)}</div>
              <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience with this product..." />
              <Button onClick={submitReview} className="bg-emerald-700 hover:bg-emerald-800">Submit Review</Button>
            </div>
            <div className="divide-y divide-border">
              {data.reviews.length === 0 && <p className="text-sm text-muted-foreground py-3">No reviews yet. Be the first to review!</p>}
              {data.reviews.map(r => (<div key={r.id} className="py-3"><div className="flex items-center gap-2 text-sm"><span className="font-medium">{r.userName}</span><span className="flex items-center gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} className={`h-3 w-3 ${n <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />)}</span></div><p className="text-sm mt-1">{r.comment}</p></div>))}
            </div>
          </CardContent></Card></TabsContent>
        </Tabs>

        {data.related.length > 0 && (<section className="mt-12"><h2 className="text-2xl font-bold mb-5">You may also like</h2><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{data.related.slice(0, 4).map(rp => <ProductCard key={rp.id} p={rp} />)}</div></section>)}
      </main>
      <Footer />
    </>
  );
}

'use client';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const { data, isLoading } = useSWR('/api/cart');
  const { data: me } = useSWR('/api/auth/me');
  const update = async (productId, qty) => { await fetch('/api/cart/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, qty }) }); mutate('/api/cart'); };
  const remove = async (productId) => { await fetch('/api/cart/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) }); toast.success('Removed from cart'); mutate('/api/cart'); };
  if (!me?.user) return <><Header /><main className="container mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in to view your cart</h1><Button asChild className="mt-4 bg-emerald-700"><Link href="/login">Sign in</Link></Button></main><Footer /></>;
  return (
    <><Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Cart</h1>
        {isLoading ? <div className="animate-pulse h-48 bg-secondary/60 rounded" /> : (data?.items?.length || 0) === 0 ? (
          <div className="text-center py-16"><ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" /><p className="mt-3 text-muted-foreground">Your cart is empty</p><Button asChild className="mt-4 bg-emerald-700"><Link href="/products">Browse Products</Link></Button></div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-3">{data.items.map(i => (
              <Card key={i.productId}><CardContent className="p-4 flex gap-4">
                <img src={i.image} alt={i.name} className="h-24 w-24 rounded object-cover border border-border" />
                <div className="flex-1">
                  <Link href={`/products/${i.productId}`} className="font-medium hover:underline">{i.name}</Link>
                  <div className="mt-1 text-sm text-muted-foreground">₹{i.price.toLocaleString('en-IN')}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center border border-border rounded-md">
                      <button onClick={() => update(i.productId, i.qty - 1)} className="h-8 w-8 grid place-items-center"><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-sm">{i.qty}</span>
                      <button onClick={() => update(i.productId, i.qty + 1)} className="h-8 w-8 grid place-items-center"><Plus className="h-3 w-3" /></button>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remove(i.productId)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="text-right font-semibold">₹{(i.price * i.qty).toLocaleString('en-IN')}</div>
              </CardContent></Card>
            ))}</div>
            <Card className="h-fit lg:sticky lg:top-32"><CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-lg">Order Summary</h2>
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{data.subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span>Tax (5% GST)</span><span>₹{data.tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span>Shipping</span><span>{data.shipping === 0 ? 'FREE' : `₹${data.shipping}`}</span></div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-3"><span>Total</span><span>₹{data.total.toLocaleString('en-IN')}</span></div>
              <Button asChild className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white"><Link href="/checkout">Proceed to Checkout</Link></Button>
            </CardContent></Card>
          </div>
        )}
      </main><Footer />
    </>
  );
}

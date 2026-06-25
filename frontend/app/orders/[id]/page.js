'use client';
import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Truck, Package, XCircle, Download, MapPin } from 'lucide-react';
import { downloadInvoice } from '../page';

const FLOW = [
  { key: 'placed', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

export default function OrderDetail({ params }) {
  const { id } = use(params);
  const { data: o, isLoading } = useSWR(`/api/orders/${id}`);
  if (isLoading || !o) return <><Header /><div className="container mx-auto p-8 animate-pulse h-64 bg-secondary/60 rounded" /><Footer /></>;
  if (o.error) return <><Header /><div className="container mx-auto p-8 text-center">Order not found</div><Footer /></>;
  const stepIdx = o.status === 'cancelled' ? -1 : FLOW.findIndex(f => f.key === o.status);
  return (
    <><Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><Link href="/orders" className="text-sm text-muted-foreground">← Back to orders</Link><h1 className="text-2xl font-bold mt-1">Order {o.id}</h1></div>
          <Button onClick={() => downloadInvoice(o)} className="bg-emerald-700"><Download className="h-4 w-4 mr-2" />Download Invoice</Button>
        </div>

        {o.status !== 'cancelled' ? (
          <Card><CardContent className="p-6">
            <h2 className="font-semibold mb-4">Order Tracking</h2>
            <div className="relative flex justify-between">{FLOW.map((f, i) => {
              const reached = i <= stepIdx;
              const I = f.icon;
              return (
                <div key={f.key} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && <div className={`absolute left-0 top-5 -translate-x-1/2 h-0.5 w-full ${i <= stepIdx ? 'bg-emerald-700' : 'bg-border'}`} style={{ left: '-50%' }} />}
                  <div className={`relative z-10 h-10 w-10 rounded-full grid place-items-center ${reached ? 'bg-emerald-700 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'}`}><I className="h-4 w-4" /></div>
                  <div className="text-xs mt-2 text-center font-medium">{f.label}</div>
                  {reached && o.updates?.find(u => u.key === f.key) && <div className="text-[10px] text-muted-foreground">{new Date(o.updates.find(u => u.key === f.key).at).toLocaleDateString()}</div>}
                </div>
              );
            })}</div>
          </CardContent></Card>
        ) : (
          <Card><CardContent className="p-6 flex items-center gap-3"><XCircle className="h-6 w-6 text-red-600" /><div><div className="font-semibold">Order Cancelled</div><div className="text-xs text-muted-foreground">This order is no longer being processed.</div></div></CardContent></Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2"><CardContent className="p-5">
            <h2 className="font-semibold mb-3">Items</h2>
            <div className="divide-y divide-border">{o.items.map(i => (
              <div key={i.productId} className="py-3 flex items-center gap-3 flex-wrap">
                <img src={i.image} alt={i.name} className="h-14 w-14 rounded object-cover border border-border" />
                <div className="flex-1 min-w-[140px]"><Link href={`/products/${i.productId}`} className="font-medium hover:underline">{i.name}</Link><div className="text-xs text-muted-foreground">Qty: {i.qty} • ₹{i.price.toLocaleString('en-IN')} each</div></div>
                <div className="font-semibold">₹{i.total.toLocaleString('en-IN')}</div>
                {i.returnRequest && (
                  <div className="flex flex-col items-end gap-1 text-right">
                    <Badge variant="outline" className="capitalize text-[10px]">Return {i.returnRequest.status}</Badge>
                    <span className="text-[10px] text-muted-foreground capitalize">Refund: {i.returnRequest.refundStatus.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            ))}</div>
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-emerald-700" />Delivery Address</div>
            <div className="text-sm"><div className="font-medium">{o.address.name}</div><div className="text-muted-foreground">{o.address.phone}</div><div className="text-muted-foreground mt-1">{o.address.line1}, {o.address.city}, {o.address.state} - {o.address.pincode}</div></div>
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{o.subtotal.toLocaleString('en-IN')}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-₹{o.discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between"><span>GST</span><span>₹{o.tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{o.shipping === 0 ? 'FREE' : `₹${o.shipping}`}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-border"><span>Total</span><span>₹{o.total.toLocaleString('en-IN')}</span></div>
            </div>
            <div className="text-xs text-muted-foreground">Payment: <Badge variant="outline">{o.paymentMethod}</Badge></div>
          </CardContent></Card>
        </div>
      </main><Footer />
    </>
  );
}

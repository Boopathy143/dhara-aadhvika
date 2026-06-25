'use client';
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UpiPayment from '@/components/UpiPayment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, Wallet, Truck, Tag, Banknote, Smartphone } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useSWR('/api/cart');
  const { data: me } = useSWR('/api/auth/me');
  const { data: addrData } = useSWR('/api/addresses');
  const [addr, setAddr] = useState({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [saveAddress, setSaveAddress] = useState(true);

  if (!me?.user) return <><Header /><main className="container mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in to checkout</h1><Button asChild className="mt-4 bg-emerald-700"><Link href="/login">Sign in</Link></Button></main><Footer /></>;

  const useSavedAddress = (a) => setAddr({ name: a.name, phone: a.phone, line1: a.line1, city: a.city, state: a.state, pincode: a.pincode });
  const addrValid = () => addr.name && addr.phone && addr.line1 && addr.city && addr.pincode;
  const applyCoupon = async () => {
    const res = await fetch('/api/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: coupon, subtotal: cart?.subtotal || 0 }) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    setAppliedCoupon(d); toast.success(`Coupon applied: ₹${d.discount} off`);
  };

  const submitOrder = async (extraPayload = {}) => {
    if (!addrValid()) { toast.error('Please fill all address fields'); return null; }
    setPlacing(true);
    if (saveAddress) { try { await fetch('/api/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addr) }); } catch {} }
    const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr, couponCode: appliedCoupon?.code, paymentMethod, ...extraPayload }) });
    const d = await res.json();
    setPlacing(false);
    if (!res.ok) { toast.error(d.error || 'Could not place order'); return null; }
    setPlacedOrder(d); mutate('/api/cart');
    toast.success(paymentMethod === 'UPI' ? 'Submitted for verification' : 'Order placed!');
    return d;
  };

  const placeCod = () => submitOrder();
  const placeUpi = (paymentDetails) => submitOrder({ paymentDetails });

  if (placedOrder) return (
    <><Header />
      <main className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-700" />
        <h1 className="text-3xl font-bold mt-4">{placedOrder.paymentMethod === 'UPI' ? 'Payment Submitted!' : 'Order Confirmed!'}</h1>
        <p className="mt-2 text-muted-foreground">Order ID: <span className="font-mono">{placedOrder.id}</span></p>
        <p className="mt-1">Total: <span className="font-bold">₹{placedOrder.total.toLocaleString('en-IN')}</span> via {placedOrder.paymentMethod}</p>
        {placedOrder.paymentMethod === 'UPI' ? (
          <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Your payment is under verification.</p>
            <p className="text-amber-800 dark:text-amber-300 mt-1">Our team will verify your UPI transaction within a few hours. You’ll receive a confirmation, after which your order will be processed.</p>
          </div>
        ) : <p className="mt-1 text-sm text-muted-foreground">Delivering to {placedOrder.address.name}, {placedOrder.address.city}.</p>}
        <div className="flex gap-3 justify-center mt-6 flex-wrap"><Button asChild className="bg-emerald-700"><Link href={`/orders/${placedOrder.id}`}>View Order</Link></Button><Button asChild variant="outline"><Link href="/products">Continue Shopping</Link></Button></div>
      </main><Footer />
    </>
  );

  const discount = appliedCoupon?.discount || 0;
  const subtotal = cart?.subtotal || 0;
  const tax = Math.round((subtotal - discount) * 0.05);
  const shipping = subtotal > 999 ? 0 : subtotal === 0 ? 0 : 49;
  const total = subtotal - discount + tax + shipping;
  const breakdown = { subtotal, discount, tax, shipping, total };

  const PAYMENT_OPTIONS = [
    { v: 'UPI', t: 'UPI / Google Pay / PhonePe / Paytm', d: 'Instant payment via UPI — verified by admin within a few hours', icon: Smartphone, recommended: true },
    { v: 'COD', t: 'Cash on Delivery', d: 'Pay when your order arrives', icon: Banknote, recommended: false },
  ];

  return (
    <><Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            {addrData?.items?.length > 0 && (<Card><CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-lg">Saved Addresses</h2>
              <div className="grid sm:grid-cols-2 gap-3">{addrData.items.map(a => (
                <button key={a.id} onClick={() => useSavedAddress(a)} className="text-left p-3 rounded-md border border-border hover:border-emerald-700 transition">
                  <div className="font-medium text-sm">{a.name}</div><div className="text-xs text-muted-foreground">{a.line1}, {a.city} - {a.pincode}</div>
                </button>
              ))}</div>
            </CardContent></Card>)}
            <Card><CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-emerald-700" />Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Full Name</Label><Input value={addr.name} onChange={e => setAddr({ ...addr, name: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={addr.phone} onChange={e => setAddr({ ...addr, phone: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Address</Label><Input value={addr.line1} onChange={e => setAddr({ ...addr, line1: e.target.value })} placeholder="House no., Street, Area" /></div>
                <div><Label>City</Label><Input value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={addr.state} onChange={e => setAddr({ ...addr, state: e.target.value })} /></div>
                <div><Label>Pincode</Label><Input value={addr.pincode} onChange={e => setAddr({ ...addr, pincode: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />Save this address for future orders</label>
            </CardContent></Card>
            <Card><CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-700" />Payment Method</h2>
              {PAYMENT_OPTIONS.map(m => { const I = m.icon; return (
                <label key={m.v} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer ${paymentMethod === m.v ? 'border-emerald-700 bg-emerald-700/5' : 'border-border'}`}>
                  <input type="radio" name="pm" checked={paymentMethod === m.v} onChange={() => setPaymentMethod(m.v)} className="mt-1" />
                  <I className="h-5 w-5 text-emerald-700 mt-0.5" />
                  <div className="flex-1"><div className="font-medium text-sm flex items-center gap-2">{m.t}{m.recommended && <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Recommended</span>}</div><div className="text-xs text-muted-foreground">{m.d}</div></div>
                </label>
              );})}
            </CardContent></Card>

            {paymentMethod === 'UPI' && (
              addrValid() ? (
                <UpiPayment amount={total} orderNote={`Dhara order for ${addr.name}`} breakdown={breakdown} onSubmit={placeUpi} submitting={placing} />
              ) : (
                <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/20"><CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">Please complete your shipping address above to see UPI payment options.</CardContent></Card>
              )
            )}
          </div>
          <Card className="h-fit lg:sticky lg:top-32"><CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Order Summary</h2>
            <div className="max-h-48 overflow-auto space-y-2 text-sm">{(cart?.items || []).map(i => (<div key={i.productId} className="flex justify-between gap-2"><span className="truncate">{i.name} x{i.qty}</span><span>₹{(i.price * i.qty).toLocaleString('en-IN')}</span></div>))}</div>
            <div className="flex gap-2 pt-2"><Input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" /><Button variant="outline" onClick={applyCoupon}><Tag className="h-4 w-4" /></Button></div>
            <div className="text-xs text-muted-foreground">Try: DHARA10, PURE500 or NEWLEAF</div>
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Coupon ({appliedCoupon.code})</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between"><span>Tax (5% GST)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>
            {paymentMethod === 'COD' ? (
              <Button onClick={placeCod} disabled={placing || subtotal === 0} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{placing ? 'Placing…' : 'Place Order (COD)'}</Button>
            ) : (
              <div className="text-xs text-center text-muted-foreground p-3 rounded-md bg-secondary/50">Use the UPI panel on the left to pay and submit verification.</div>
            )}
          </CardContent></Card>
        </div>
      </main><Footer />
    </>
  );
}

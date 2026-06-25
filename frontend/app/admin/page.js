'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trash2, Pencil, Plus, IndianRupee, Package, ShoppingBag, Users, Tag, X, CheckCircle2, XCircle, Maximize2, Download, ZoomIn, ZoomOut, FileText, ExternalLink, Settings, Image as ImageIcon, Truck, Wallet } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { UNIT_OPTIONS, formatPack, inr } from '@/lib/format';
import AdminCMS from './_cms';
import AdminBanners from './_banners';
import AdminUsersPanel from './_users';
import AdminDelivery from './_delivery';
import AdminLedger from './_ledger';

const empty = {
  name: '', brand: '', category: '', price: 0, mrp: 0, image: '', description: '',
  stock: 0,
  weight: '', unit: 'Gram',
  isFeatured: false, isNew: true, isBestSeller: false,
  ingredients: '', benefits: '',
  usage: '', storage: '', shelfLife: '',
  manufacturer: '', countryOfOrigin: 'India', fssaiNumber: '',
  nutrition: '',
  specs: {}, keyFeatures: [], additionalInfo: {},
};

const RETURN_STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'pickup_scheduled', 'pickup_completed', 'refunded', 'replaced', 'closed'];
const REFUND_STATUSES = ['not_initiated', 'processing', 'refunded'];
const REPLACEMENT_STATUSES = ['not_applicable', 'pending', 'dispatched', 'delivered'];
const labelize = (s) => (s || '').replace(/_/g, ' ');

export default function AdminPage() {
  const { data: me } = useSWR('/api/auth/me');
  const { data: stats } = useSWR('/api/admin/stats');
  const { data: products, mutate: refetchProducts } = useSWR('/api/products?limit=48');
  const { data: orders, mutate: refetchOrders } = useSWR('/api/admin/orders');
  const { data: payments, mutate: refetchPayments } = useSWR('/api/admin/payments');
  const { data: cats = [] } = useSWR('/api/categories');
  const { data: brands = [] } = useSWR('/api/brands');
  const { data: coupons, mutate: refetchCoupons } = useSWR('/api/admin/coupons');
  const { data: reviews, mutate: refetchReviews } = useSWR('/api/admin/reviews');
  const { data: returns, mutate: refetchReturns } = useSWR('/api/admin/returns');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discountPct: 0, discountFlat: 0, minOrder: 0, description: '' });
  const [specRow, setSpecRow] = useState({ key: '', value: '' });
  const [infoRow, setInfoRow] = useState({ key: '', value: '' });
  const [featureInput, setFeatureInput] = useState('');
  const [receipt, setReceipt] = useState(null);  // { src, orderId, txnId, kind }
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingFor, setRejectingFor] = useState(null);

  if (!me?.user) return <><Header /><main className="container mx-auto py-16 text-center"><h1 className="text-2xl font-bold">Sign in required</h1><Button asChild className="mt-4 bg-emerald-700"><Link href="/login">Sign in</Link></Button></main><Footer /></>;
  if (me.user.role !== 'admin') return <><Header /><main className="container mx-auto py-16 text-center"><h1 className="text-2xl font-bold">Admin access only</h1><p className="text-muted-foreground mt-2">Your account does not have admin privileges.</p></main><Footer /></>;

  const openNew = () => { setForm(empty); setEditingId(null); setOpen(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name || '', brand: p.brand || '', category: p.category || '',
      price: p.price || 0, mrp: p.mrp || 0, image: p.image || '', description: p.description || '',
      stock: p.stock || 0,
      weight: p.weight || '',
      unit: p.unit || 'Gram',
      isFeatured: !!p.isFeatured, isNew: !!p.isNew, isBestSeller: !!p.isBestSeller,
      ingredients: p.ingredients || '', benefits: p.benefits || '',
      usage: p.usage || '', storage: p.storage || '', shelfLife: p.shelfLife || '',
      manufacturer: p.manufacturer || '', countryOfOrigin: p.countryOfOrigin || 'India', fssaiNumber: p.fssaiNumber || '',
      nutrition: p.nutrition || '',
      specs: p.specs || {}, keyFeatures: p.keyFeatures || [], additionalInfo: p.additionalInfo || {},
    });
    setEditingId(p.id); setOpen(true);
  };
  const save = async () => {
    if (!form.name) return toast.error('Product name is required');
    const payload = { ...form, price: Number(form.price), mrp: Number(form.mrp), stock: Number(form.stock), images: [form.image] };
    const res = editingId
      ? await fetch(`/api/admin/products/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
    toast.success(editingId ? 'Updated' : 'Created'); setOpen(false); refetchProducts();
  };
  const del = async (id) => { if (!confirm('Delete this product?')) return; await fetch(`/api/admin/products/${id}`, { method: 'DELETE' }); toast.success('Deleted'); refetchProducts(); };
  const updateStatus = async (id, status) => { await fetch(`/api/admin/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); toast.success('Status updated'); refetchOrders(); };
  const addCoupon = async () => {
    const payload = { ...couponForm, discountPct: Number(couponForm.discountPct) || 0, discountFlat: Number(couponForm.discountFlat) || 0, minOrder: Number(couponForm.minOrder) || 0 };
    await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setCouponForm({ code: '', discountPct: 0, discountFlat: 0, minOrder: 0, description: '' });
    refetchCoupons(); toast.success('Coupon created');
  };
  const delCoupon = async (id) => { await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' }); refetchCoupons(); };
  const delReview = async (id) => { await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }); refetchReviews(); toast.success('Review removed'); };

  const addSpec = () => { if (!specRow.key.trim()) return; setForm({ ...form, specs: { ...form.specs, [specRow.key.trim()]: specRow.value } }); setSpecRow({ key: '', value: '' }); };
  const removeSpec = (k) => { const next = { ...form.specs }; delete next[k]; setForm({ ...form, specs: next }); };
  const addInfo = () => { if (!infoRow.key.trim()) return; setForm({ ...form, additionalInfo: { ...form.additionalInfo, [infoRow.key.trim()]: infoRow.value } }); setInfoRow({ key: '', value: '' }); };
  const removeInfo = (k) => { const next = { ...form.additionalInfo }; delete next[k]; setForm({ ...form, additionalInfo: next }); };
  const addFeature = () => { if (!featureInput.trim()) return; setForm({ ...form, keyFeatures: [...form.keyFeatures, featureInput.trim()] }); setFeatureInput(''); };
  const removeFeature = (i) => setForm({ ...form, keyFeatures: form.keyFeatures.filter((_, idx) => idx !== i) });

  const updateReturn = async (orderId, productId, patch) => {
    await fetch(`/api/admin/returns/${orderId}/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    toast.success('Return updated'); refetchReturns(); refetchOrders();
  };

  const verifyPayment = async (orderId, action, reason = '') => {
    const res = await fetch(`/api/admin/orders/${orderId}/verify-payment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success(action === 'approve' ? 'Payment verified' : 'Payment rejected');
    refetchPayments(); refetchOrders();
  };

  const paymentStatusBadge = (o) => {
    if (o.paymentMethod !== 'UPI') return <Badge variant="outline">COD</Badge>;
    if (o.paymentVerified) return <Badge className="bg-emerald-700 text-white" data-testid={`payment-status-${o.id}`}>Verified</Badge>;
    if (o.status === 'payment_rejected') return <Badge className="bg-red-500 text-white" data-testid={`payment-status-${o.id}`}>Rejected</Badge>;
    return <Badge className="bg-amber-500 text-white" data-testid={`payment-status-${o.id}`}>Pending</Badge>;
  };

  const pendingPayments = (payments?.items || []).filter(o => o.paymentMethod === 'UPI' && !o.paymentVerified && o.status !== 'payment_rejected');

  return (
    <><Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-end justify-between mb-6">
          <div><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="text-muted-foreground">Welcome back, {me.user.name}</p></div>
          <Badge className="bg-emerald-700 text-white">Dhara Aadhvika · Admin</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { i: IndianRupee, l: 'Revenue', v: inr(stats?.revenue || 0), c: 'from-emerald-600 to-emerald-800' },
            { i: ShoppingBag, l: 'Orders', v: stats?.orders || 0, c: 'from-amber-600 to-amber-800' },
            { i: Package, l: 'Products', v: stats?.products || 0, c: 'from-stone-600 to-stone-800' },
            { i: Users, l: 'Users', v: stats?.users || 0, c: 'from-emerald-700 to-amber-700' },
          ].map(({ i: I, l, v, c }) => (
            <Card key={l}><CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${c} grid place-items-center text-white`}><I className="h-6 w-6" /></div>
              <div><div className="text-xs text-muted-foreground">{l}</div><div className="text-2xl font-bold">{v}</div></div>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card><CardContent className="p-5">
            <h3 className="font-semibold mb-3">Revenue (last 7 days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats?.days || []}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line type="monotone" dataKey="revenue" stroke="#15803d" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart>
            </ResponsiveContainer>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <h3 className="font-semibold mb-3">Orders (last 7 days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.days || []}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="orders" fill="#d97706" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments{pendingPayments.length ? ` (${pendingPayments.length})` : ''}</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="coupons" data-testid="tab-coupons">Coupons</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
            <TabsTrigger value="returns" data-testid="tab-returns">Returns{returns?.items?.length ? ` (${returns.items.length})` : ''}</TabsTrigger>
            <TabsTrigger value="delivery" data-testid="tab-delivery"><Truck className="h-3.5 w-3.5 mr-1.5" />Delivery</TabsTrigger>
            <TabsTrigger value="ledger" data-testid="tab-ledger"><Wallet className="h-3.5 w-3.5 mr-1.5" />Ledger</TabsTrigger>
            <TabsTrigger value="banners" data-testid="tab-banners"><ImageIcon className="h-3.5 w-3.5 mr-1.5" />Banners</TabsTrigger>
            <TabsTrigger value="cms" data-testid="tab-cms"><Settings className="h-3.5 w-3.5 mr-1.5" />Site Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <div className="flex justify-between mb-4"><h2 className="text-xl font-semibold">Product Management</h2><Button onClick={openNew} className="bg-emerald-700" data-testid="add-product-btn"><Plus className="h-4 w-4 mr-2" />Add Product</Button></div>
            <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-secondary/40"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-left">Pack</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Stock</th><th className="p-3 text-left">Rating</th><th className="p-3"></th></tr></thead>
              <tbody>{(products?.items || []).map(p => (<tr key={p.id} className="border-t border-border">
                <td className="p-3 flex items-center gap-3"><img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover border border-border" /><span className="font-medium">{p.name}</span></td>
                <td className="p-3 text-muted-foreground">{formatPack(p) || '—'}</td>
                <td className="p-3">{inr(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">{p.rating} ({p.ratingCount})</td>
                <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>))}</tbody>
            </table></CardContent></Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Order Management</h2>
            <div className="space-y-3">{(orders?.items || []).map(o => (
              <Card key={o.id}><CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]"><div className="font-mono text-sm font-medium">{o.id}</div><div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()} • {o.items.length} items</div><div className="text-xs text-muted-foreground">{o.address.name}, {o.address.city}</div></div>
                <div className="font-semibold">{inr(o.total)}</div>
                <Badge variant="outline" className="capitalize">{labelize(o.status)}</Badge>
                {paymentStatusBadge(o)}
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent>{['placed','payment_verification_pending','confirmed','payment_rejected','shipped','delivered','cancelled'].map(s => <SelectItem key={s} value={s} className="capitalize">{labelize(s)}</SelectItem>)}</SelectContent></Select>
                <Button size="sm" variant="outline" asChild><Link href={`/orders/${o.id}`}>View</Link></Button>
              </CardContent></Card>
            ))}{(orders?.items || []).length === 0 && <p className="text-muted-foreground text-center py-8">No orders yet</p>}</div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Payment Verification</h2>
            <p className="text-sm text-muted-foreground mb-4">Review UPI payment receipts uploaded by customers and verify or reject each payment.</p>
            <div className="space-y-3">{(payments?.items || []).length === 0 && <p className="text-muted-foreground text-center py-8">No UPI orders yet</p>}
              {(payments?.items || []).map(o => {
                const pd = o.paymentDetails || {};
                const isImg = pd.screenshot && typeof pd.screenshot === 'string' && pd.screenshot.startsWith('data:image');
                const isPdf = pd.screenshot && typeof pd.screenshot === 'string' && pd.screenshot.startsWith('data:application/pdf');
                return (
                  <Card key={o.id} data-testid={`payment-row-${o.id}`}><CardContent className="p-4 flex flex-wrap items-start gap-4">
                    {pd.screenshot ? (
                      <button type="button" onClick={() => setReceipt({ src: pd.screenshot, orderId: o.id, txnId: pd.transactionId, kind: isPdf ? 'pdf' : 'image' })} className="relative h-24 w-24 rounded border border-border overflow-hidden bg-secondary/40 hover:border-emerald-700 transition group" data-testid={`payment-receipt-thumb-${o.id}`}>
                        {isImg ? <img src={pd.screenshot} alt="receipt" className="h-full w-full object-cover" /> : isPdf ? <div className="h-full w-full grid place-items-center"><FileText className="h-8 w-8 text-amber-600" /></div> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No preview</div>}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100"><Maximize2 className="h-5 w-5 text-white" /></div>
                      </button>
                    ) : <div className="h-24 w-24 rounded border border-dashed border-border bg-secondary/40 grid place-items-center text-xs text-muted-foreground">No receipt</div>}
                    <div className="flex-1 min-w-[220px]">
                      <div className="font-mono text-sm font-medium">{o.id}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                      <div className="text-sm mt-1">{o.customer?.name} • {o.customer?.email}</div>
                      <div className="text-xs"><span className="text-muted-foreground">Txn ID:</span> <span className="font-mono">{pd.transactionId || '—'}</span></div>
                      <div className="font-semibold mt-1">{inr(o.total)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[180px]">
                      {paymentStatusBadge(o)}
                      {!o.paymentVerified && o.status !== 'payment_rejected' && o.paymentMethod === 'UPI' && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={() => verifyPayment(o.id, 'approve')} data-testid={`verify-approve-${o.id}`}><CheckCircle2 className="h-4 w-4 mr-1" />Verify</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => { setRejectingFor(o.id); setRejectReason(''); }} data-testid={`verify-reject-${o.id}`}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                        </div>
                      )}
                      {pd.screenshot && (
                        <a href={pd.screenshot} download={`receipt-${o.id}.${isPdf ? 'pdf' : 'png'}`} className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1"><Download className="h-3 w-3" />Download receipt</a>
                      )}
                    </div>
                  </CardContent></Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <AdminUsersPanel />
          </TabsContent>

          <TabsContent value="coupons" className="mt-4 space-y-4">
            <Card><CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Tag className="h-4 w-4 text-emerald-700" />Create Coupon</h3>
              <div className="grid sm:grid-cols-5 gap-3">
                <div><Label>Code</Label><Input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="DHARA10" /></div>
                <div><Label>% off</Label><Input type="number" value={couponForm.discountPct} onChange={e => setCouponForm({ ...couponForm, discountPct: e.target.value })} /></div>
                <div><Label>Flat ₹ off</Label><Input type="number" value={couponForm.discountFlat} onChange={e => setCouponForm({ ...couponForm, discountFlat: e.target.value })} /></div>
                <div><Label>Min order</Label><Input type="number" value={couponForm.minOrder} onChange={e => setCouponForm({ ...couponForm, minOrder: e.target.value })} /></div>
                <div className="flex items-end"><Button onClick={addCoupon} className="w-full bg-emerald-700">Add</Button></div>
              </div>
              <div><Label>Description</Label><Input value={couponForm.description} onChange={e => setCouponForm({ ...couponForm, description: e.target.value })} /></div>
            </CardContent></Card>
            <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-secondary/40"><tr><th className="p-3 text-left">Code</th><th className="p-3 text-left">Discount</th><th className="p-3 text-left">Min Order</th><th className="p-3 text-left">Description</th><th className="p-3"></th></tr></thead>
              <tbody>{(coupons?.items || []).map(c => (<tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">{c.discountPct ? `${c.discountPct}%` : inr(c.discountFlat)}</td>
                <td className="p-3">{inr(c.minOrder || 0)}</td>
                <td className="p-3 text-muted-foreground">{c.description}</td>
                <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => delCoupon(c.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>))}</tbody>
            </table></CardContent></Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            <div className="space-y-3">{(reviews?.items || []).map(r => (
              <Card key={r.id}><CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.userName} · <span className="text-amber-600">{'★'.repeat(r.rating)}</span></div>
                  <div className="text-xs text-muted-foreground">Product: <Link href={`/products/${r.productId}`} className="underline">{r.productId}</Link> • {new Date(r.createdAt).toLocaleDateString()}</div>
                  <p className="text-sm mt-1">{r.comment}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => delReview(r.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
              </CardContent></Card>
            ))}{(reviews?.items || []).length === 0 && <p className="text-muted-foreground text-center py-8">No reviews yet</p>}</div>
          </TabsContent>

          <TabsContent value="returns" className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Return Requests</h2>
            <p className="text-sm text-muted-foreground mb-3">Workflow: pending → under review → approved/rejected → pickup scheduled → pickup completed → refunded/replaced → closed</p>
            <div className="space-y-3">{(returns?.items || []).map(r => (
              <Card key={`${r.orderId}-${r.productId}`} data-testid={`return-row-${r.orderId}-${r.productId}`}><CardContent className="p-4 flex flex-wrap items-start gap-4">
                <img src={r.productImage} alt={r.productName} className="h-14 w-14 rounded object-cover border border-border" />
                <div className="flex-1 min-w-[220px]">
                  <div className="font-medium text-sm">{r.productName} <span className="text-muted-foreground">x{r.qty}</span></div>
                  <div className="text-xs text-muted-foreground">Order: <Link href={`/orders/${r.orderId}`} className="underline font-mono">{r.orderId}</Link> • {r.customer?.name} ({r.customer?.email})</div>
                  <div className="text-xs mt-1"><span className="font-medium">Reason:</span> {r.reason}</div>
                  {r.description && <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>}
                  <div className="text-[11px] text-muted-foreground mt-1">Requested {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                {r.image && <button type="button" onClick={() => setReceipt({ src: r.image, orderId: r.orderId, txnId: 'Return proof', kind: 'image' })} className="h-20 w-20 rounded overflow-hidden border border-border hover:border-emerald-700 transition" data-testid={`return-image-${r.orderId}-${r.productId}`}><img src={r.image} alt="proof" className="h-full w-full object-cover" /></button>}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Status</span>
                    <Select value={r.status} onValueChange={(v) => updateReturn(r.orderId, r.productId, { status: v })}>
                      <SelectTrigger className="h-8 text-xs w-[150px]" data-testid={`return-status-select-${r.orderId}-${r.productId}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{RETURN_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{labelize(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Refund</span>
                    <Select value={r.refundStatus} onValueChange={(v) => updateReturn(r.orderId, r.productId, { refundStatus: v })}>
                      <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{REFUND_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{labelize(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Replacement</span>
                    <Select value={r.replacementStatus || 'not_applicable'} onValueChange={(v) => updateReturn(r.orderId, r.productId, { replacementStatus: v })}>
                      <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{REPLACEMENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{labelize(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent></Card>
            ))}{(returns?.items || []).length === 0 && <p className="text-muted-foreground text-center py-8">No return requests yet</p>}</div>
          </TabsContent>

          <TabsContent value="banners" className="mt-4">
            <AdminBanners />
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            <AdminDelivery />
          </TabsContent>

          <TabsContent value="ledger" className="mt-4">
            <AdminLedger />
          </TabsContent>

          <TabsContent value="cms" className="mt-4">
            <AdminCMS />
          </TabsContent>
        </Tabs>

        {/* Product Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="product-name-input" /></div>
              <div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Brand</Label><Select value={form.brand} onValueChange={v => setForm({ ...form, brand: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} data-testid="product-price-input" /></div>
              <div><Label>MRP (₹)</Label><Input type="number" value={form.mrp} onChange={e => setForm({ ...form, mrp: e.target.value })} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Weight / Size</Label><Input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="500" data-testid="product-weight-input" /></div>
                <div><Label>Unit</Label>
                  <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                    <SelectTrigger data-testid="product-unit-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>{UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="sm:col-span-2"><Label>Image URL</Label><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-3">
              <h3 className="font-semibold text-sm">Product Specifications</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label>Ingredients</Label><Textarea rows={2} value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} placeholder="e.g. 100% pure sugarcane jaggery." /></div>
                <div className="sm:col-span-2"><Label>Benefits</Label><Textarea rows={2} value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} placeholder="Health benefits of this product..." /></div>
                <div className="sm:col-span-2"><Label>Usage Instructions</Label><Textarea rows={2} value={form.usage} onChange={e => setForm({ ...form, usage: e.target.value })} placeholder="How to use this product..." /></div>
                <div className="sm:col-span-2"><Label>Storage Instructions</Label><Textarea rows={2} value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} placeholder="Store in a cool, dry place..." /></div>
                <div><Label>Shelf Life</Label><Input value={form.shelfLife} onChange={e => setForm({ ...form, shelfLife: e.target.value })} placeholder="12 months" /></div>
                <div><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="Manufacturer name" /></div>
                <div><Label>Country of Origin</Label><Input value={form.countryOfOrigin} onChange={e => setForm({ ...form, countryOfOrigin: e.target.value })} /></div>
                <div><Label>FSSAI Number</Label><Input value={form.fssaiNumber} onChange={e => setForm({ ...form, fssaiNumber: e.target.value })} placeholder="14-digit FSSAI Lic. no." /></div>
                <div className="sm:col-span-2"><Label>Nutritional Information</Label><Textarea rows={3} value={form.nutrition} onChange={e => setForm({ ...form, nutrition: e.target.value })} placeholder="Per 100g: Energy 380 kcal, Protein 0.4g, Carbs 95g..." /></div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-2">
              <h3 className="font-semibold text-sm">Key Features</h3>
              <div className="flex gap-2"><Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="e.g. 100% chemical-free" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} /><Button type="button" variant="outline" onClick={addFeature}><Plus className="h-4 w-4" /></Button></div>
              <ul className="space-y-1">{form.keyFeatures.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm bg-secondary/40 rounded px-3 py-1.5"><span>{f}</span><button type="button" onClick={() => removeFeature(i)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button></li>
              ))}</ul>
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-2">
              <h3 className="font-semibold text-sm">Additional Specifications</h3>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input value={specRow.key} onChange={e => setSpecRow({ ...specRow, key: e.target.value })} placeholder="Attribute (e.g. Pressing method)" /><Input value={specRow.value} onChange={e => setSpecRow({ ...specRow, value: e.target.value })} placeholder="Value (e.g. Wood pressed)" /><Button type="button" variant="outline" onClick={addSpec}><Plus className="h-4 w-4" /></Button></div>
              <ul className="space-y-1">{Object.entries(form.specs).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between text-sm bg-secondary/40 rounded px-3 py-1.5"><span><span className="text-muted-foreground">{k}:</span> {v}</span><button type="button" onClick={() => removeSpec(k)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button></li>
              ))}</ul>
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-2">
              <h3 className="font-semibold text-sm">Additional Information</h3>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input value={infoRow.key} onChange={e => setInfoRow({ ...infoRow, key: e.target.value })} placeholder="Attribute" /><Input value={infoRow.value} onChange={e => setInfoRow({ ...infoRow, value: e.target.value })} placeholder="Value" /><Button type="button" variant="outline" onClick={addInfo}><Plus className="h-4 w-4" /></Button></div>
              <ul className="space-y-1">{Object.entries(form.additionalInfo).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between text-sm bg-secondary/40 rounded px-3 py-1.5"><span><span className="text-muted-foreground">{k}:</span> {v}</span><button type="button" onClick={() => removeInfo(k)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button></li>
              ))}</ul>
            </div>

            <Button onClick={save} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white mt-4" data-testid="product-save-btn">{editingId ? 'Save Changes' : 'Create Product'}</Button>
          </DialogContent>
        </Dialog>

        {/* Receipt full-screen viewer */}
        <ReceiptViewer receipt={receipt} onClose={() => setReceipt(null)} />

        {/* Reject reason dialog */}
        <Dialog open={!!rejectingFor} onOpenChange={(v) => !v && setRejectingFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Payment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label>Reason for rejection</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Transaction ID not found in our UPI ledger" data-testid="reject-reason-input" />
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={async () => { await verifyPayment(rejectingFor, 'reject', rejectReason); setRejectingFor(null); }} data-testid="confirm-reject-btn">Reject Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main><Footer />
    </>
  );
}

function ReceiptViewer({ receipt, onClose }) {
  const [scale, setScale] = useState(1);
  if (!receipt) return null;
  const isPdf = receipt.kind === 'pdf';
  return (
    <Dialog open={!!receipt} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0 overflow-hidden" data-testid="receipt-viewer">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
          <div>
            <div className="font-semibold text-sm">Payment Receipt</div>
            <div className="text-xs text-muted-foreground">Order <span className="font-mono">{receipt.orderId}</span>{receipt.txnId ? ` • Txn ${receipt.txnId}` : ''}</div>
          </div>
          <div className="flex items-center gap-1">
            {!isPdf && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))} data-testid="receipt-zoom-out"><ZoomOut className="h-4 w-4" /></Button>
                <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.min(4, +(s + 0.25).toFixed(2)))} data-testid="receipt-zoom-in"><ZoomIn className="h-4 w-4" /></Button>
              </>
            )}
            <a href={receipt.src} download={`receipt-${receipt.orderId}.${isPdf ? 'pdf' : 'png'}`} className="inline-flex items-center gap-1 text-xs px-3 h-8 rounded border border-border hover:border-emerald-700"><Download className="h-3.5 w-3.5" />Download</a>
            <a href={receipt.src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-3 h-8 rounded border border-border hover:border-emerald-700"><ExternalLink className="h-3.5 w-3.5" />Open</a>
          </div>
        </div>
        <div className="overflow-auto bg-stone-900/95 grid place-items-center" style={{ height: '78vh' }}>
          {isPdf ? (
            <iframe title="receipt" src={receipt.src} className="w-full h-full bg-white" />
          ) : (
            <img src={receipt.src} alt="receipt" style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.15s' }} className="max-w-none" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

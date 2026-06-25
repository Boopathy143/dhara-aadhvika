'use client';
import useSWR, { mutate } from 'swr';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, RotateCw, XCircle, CheckCircle2, Truck, Package, Clock, Undo2, Upload } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const RETURN_REASONS = ['Damaged or defective item', 'Wrong item delivered', 'Quality not as expected', 'Item missing from order', 'No longer needed', 'Other'];

const returnStatusMeta = {
  pending: { color: 'bg-amber-500', label: 'Return Pending' },
  approved: { color: 'bg-emerald-600', label: 'Return Approved' },
  rejected: { color: 'bg-red-500', label: 'Return Rejected' },
};
const refundStatusMeta = {
  not_initiated: 'Refund: Not initiated',
  processing: 'Refund: Processing',
  refunded: 'Refund: Refunded',
};

const statusMeta = {
  placed: { color: 'bg-blue-500', label: 'Placed', icon: Clock },
  confirmed: { color: 'bg-indigo-500', label: 'Confirmed', icon: CheckCircle2 },
  shipped: { color: 'bg-amber-600', label: 'Shipped', icon: Truck },
  delivered: { color: 'bg-emerald-700', label: 'Delivered', icon: Package },
  cancelled: { color: 'bg-red-500', label: 'Cancelled', icon: XCircle },
};

export function downloadInvoice(order) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  // Header
  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, W, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('DHARA AADHVIKA', 14, 17);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Pure • Honest • Rooted', 14, 24);
  doc.text('FSSAI: 12345678901234 • GSTIN: 33ABCDE1234F1Z5', 14, 30);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', W - 14, 17, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: INV-${order.id}`, W - 14, 24, { align: 'right' });
  doc.text(`Order #: ${order.id}`, W - 14, 28, { align: 'right' });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, W - 14, 32, { align: 'right' });

  // Bill / Ship to
  let y = 48;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('BILL TO / SHIP TO', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.address.name, 14, y + 6);
  doc.text(order.address.phone || '', 14, y + 11);
  doc.text(order.address.line1, 14, y + 16);
  doc.text(`${order.address.city}, ${order.address.state || ''} - ${order.address.pincode}`, 14, y + 21);
  doc.text(`Email: ${order.customer?.email || ''}`, 14, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT', W - 60, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Method: ${order.paymentMethod}`, W - 60, y + 6);
  doc.text(`Status: ${order.status.toUpperCase()}`, W - 60, y + 11);

  // Items table
  autoTable(doc, {
    startY: y + 36,
    head: [['#', 'Item', 'Qty', 'Price', 'Total']],
    body: order.items.map((it, idx) => [idx + 1, it.name, it.qty, `₹${it.price.toLocaleString('en-IN')}`, `₹${it.total.toLocaleString('en-IN')}`]),
    theme: 'striped',
    headStyles: { fillColor: [21, 128, 61], textColor: 255 },
    styles: { fontSize: 9 },
  });

  let ty = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  const row = (label, value, bold) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.text(label, W - 60, ty); doc.text(value, W - 14, ty, { align: 'right' }); ty += 6; };
  row('Subtotal', `₹${order.subtotal.toLocaleString('en-IN')}`);
  if (order.discount) row(`Discount (${order.couponCode || 'Coupon'})`, `-₹${order.discount.toLocaleString('en-IN')}`);
  row('GST (5%)', `₹${order.tax.toLocaleString('en-IN')}`);
  row('Shipping', order.shipping ? `₹${order.shipping.toLocaleString('en-IN')}` : 'FREE');
  doc.setDrawColor(180); doc.line(W - 70, ty - 3, W - 14, ty - 3);
  row('GRAND TOTAL', `₹${order.total.toLocaleString('en-IN')}`, true);

  // Footer
  ty = Math.max(ty + 10, 250);
  doc.setFontSize(8); doc.setTextColor(120);
  doc.text('Thank you for choosing Dhara Aadhvika — nourishing families the natural way.', 14, ty);
  doc.text('For support: hello@dharaaadhvika.com | +91 98765 43210', 14, ty + 5);
  doc.text('This is a computer-generated invoice and does not require a signature.', 14, ty + 10);

  doc.save(`Invoice-${order.id}.pdf`);
}

export default function OrdersPage() {
  const { data, isLoading } = useSWR('/api/orders');
  const { data: me } = useSWR('/api/auth/me');
  const [returnTarget, setReturnTarget] = useState(null); // { orderId, productId, name }
  const [returnForm, setReturnForm] = useState({ reason: '', description: '', image: null, filename: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const cancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    const res = await fetch(`/api/orders/${id}/cancel`, { method: 'POST' });
    if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
    toast.success('Order cancelled'); mutate('/api/orders');
  };
  const reorder = async (id) => {
    const res = await fetch(`/api/orders/${id}/reorder`, { method: 'POST' });
    if (!res.ok) { toast.error('Could not re-add items'); return; }
    toast.success('Items added back to cart'); window.location.href = '/cart';
  };
  const openReturn = (orderId, item) => { setReturnTarget({ orderId, productId: item.productId, name: item.name }); setReturnForm({ reason: '', description: '', image: null, filename: '' }); };
  const onReturnFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setReturnForm((r) => ({ ...r, image: reader.result, filename: f.name }));
    reader.readAsDataURL(f);
  };
  const submitReturn = async () => {
    if (!returnForm.reason) return toast.error('Please select a return reason');
    setSubmittingReturn(true);
    const res = await fetch(`/api/orders/${returnTarget.orderId}/return/${returnTarget.productId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: returnForm.reason, description: returnForm.description, image: returnForm.image }),
    });
    setSubmittingReturn(false);
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    toast.success('Return request submitted'); setReturnTarget(null); mutate('/api/orders');
  };
  if (!me?.user) return <><Header /><main className="container mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in to view orders</h1><Button asChild className="mt-4 bg-emerald-700"><Link href="/login">Sign in</Link></Button></main><Footer /></>;
  return (
    <><Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        {isLoading ? <div className="animate-pulse h-32 bg-secondary/60 rounded" /> : (data?.items?.length || 0) === 0 ? (
          <div className="text-center py-16"><Package className="h-12 w-12 mx-auto text-muted-foreground" /><p className="mt-3 text-muted-foreground">No orders yet</p><Button asChild className="mt-4 bg-emerald-700"><Link href="/products">Start Shopping</Link></Button></div>
        ) : (
          <div className="space-y-4">{data.items.map(o => {
            const s = statusMeta[o.status] || statusMeta.placed;
            const I = s.icon;
            return (<Card key={o.id}><CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-3">
                <div><div className="text-xs text-muted-foreground">Order ID</div><div className="font-mono font-medium">{o.id}</div></div>
                <div><div className="text-xs text-muted-foreground">Placed</div><div className="text-sm">{new Date(o.createdAt).toLocaleString()}</div></div>
                <div><div className="text-xs text-muted-foreground">Total</div><div className="font-semibold">₹{o.total.toLocaleString('en-IN')}</div></div>
                <Badge className={`${s.color} text-white capitalize gap-1`}><I className="h-3 w-3" />{s.label}</Badge>
              </div>
              <div className="space-y-3 mb-3">{o.items.map(i => {
                const rr = i.returnRequest;
                const rm = rr && returnStatusMeta[rr.status];
                return (
                  <div key={i.productId} className="flex items-center gap-3 text-sm flex-wrap">
                    <img src={i.image} alt={i.name} className="h-12 w-12 rounded object-cover border border-border" />
                    <span className="flex-1 min-w-[120px]">{i.name} x{i.qty}</span>
                    <span>₹{i.total.toLocaleString('en-IN')}</span>
                    {rr ? (
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`${rm.color} text-white text-[10px]`}>{rm.label}</Badge>
                        <span className="text-[10px] text-muted-foreground">{refundStatusMeta[rr.refundStatus]}</span>
                      </div>
                    ) : o.status === 'delivered' ? (
                      <Button size="sm" variant="outline" onClick={() => openReturn(o.id, i)}><Undo2 className="h-3.5 w-3.5 mr-1" />Return</Button>
                    ) : null}
                  </div>
                );
              })}</div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => downloadInvoice(o)}><Download className="h-4 w-4 mr-1" />Invoice</Button>
                <Button size="sm" variant="outline" onClick={() => reorder(o.id)}><RotateCw className="h-4 w-4 mr-1" />Reorder</Button>
                {!['shipped','delivered','cancelled'].includes(o.status) && <Button size="sm" variant="outline" className="text-red-600" onClick={() => cancel(o.id)}><XCircle className="h-4 w-4 mr-1" />Cancel</Button>}
                <Button size="sm" asChild variant="ghost" className="ml-auto"><Link href={`/orders/${o.id}`}>View tracking →</Link></Button>
              </div>
            </CardContent></Card>);
          })}</div>
        )}
      </main>

      <Dialog open={!!returnTarget} onOpenChange={(v) => !v && setReturnTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Return — {returnTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Return Reason *</Label>
              <Select value={returnForm.reason} onValueChange={(v) => setReturnForm({ ...returnForm, reason: v })}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>{RETURN_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={returnForm.description} onChange={e => setReturnForm({ ...returnForm, description: e.target.value })} placeholder="Tell us more about the issue..." /></div>
            <div>
              <Label>Image Proof</Label>
              <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background cursor-pointer hover:border-emerald-700 transition">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{returnForm.filename || 'Choose image (max 2 MB)'}</span>
                <input type="file" accept="image/*" onChange={onReturnFile} className="hidden" />
              </label>
              {returnForm.image && <img src={returnForm.image} alt="preview" className="h-24 mt-2 rounded border border-border object-contain bg-secondary/30" />}
            </div>
            <Button onClick={submitReturn} disabled={submittingReturn} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{submittingReturn ? 'Submitting…' : 'Submit Return Request'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </>
  );
}

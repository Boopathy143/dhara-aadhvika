'use client';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2, Send, Check, X, FileText, Download, ArrowRight, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { inr, inrPdf, UNIT_OPTIONS } from '@/lib/format';
import { COMPANY } from '@/lib/company';

const STATUS_OPTIONS = ['all', 'draft', 'sent', 'accepted', 'rejected', 'converted', 'expired'];

const STATUS_COLORS = {
  draft: 'bg-stone-500',
  sent: 'bg-amber-600',
  accepted: 'bg-emerald-600',
  rejected: 'bg-red-500',
  converted: 'bg-blue-600',
  expired: 'bg-stone-400',
};

const EMPTY_ITEM = { productId: null, name: '', description: '', qty: 1, unit: 'pcs', price: 0 };
const EMPTY_QUOTE = {
  id: null,
  customerName: '', customerEmail: '', customerPhone: '',
  shippingAddress: { line1: '', city: '', state: '', pincode: '' },
  items: [{ ...EMPTY_ITEM }],
  taxRate: 5, shipping: 0, discount: 0,
  notes: '', validUntil: '',
};

export default function AdminQuotations() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const swrKey = `/api/admin/quotations?status=${statusFilter}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
  const { data, mutate } = useSWR(swrKey);
  const { data: users } = useSWR('/api/admin/users');
  const { data: products } = useSWR('/api/products?limit=200');
  const [dlgOpen, setDlgOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(EMPTY_QUOTE);

  const totals = useMemo(() => {
    const items = data?.items || [];
    return {
      count: items.length,
      pending: items.filter(q => q.status === 'sent').length,
      accepted: items.filter(q => q.status === 'accepted').length,
      converted: items.filter(q => q.status === 'converted').length,
      value: items.reduce((s, q) => s + (q.total || 0), 0),
    };
  }, [data]);

  const computeTotals = (f) => {
    const subtotal = f.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const discount = Number(f.discount) || 0;
    const taxRate = Number(f.taxRate) || 0;
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = (taxableBase * taxRate) / 100;
    const shipping = Number(f.shipping) || 0;
    return {
      subtotal: round2(subtotal),
      discount: round2(discount),
      tax: round2(tax),
      shipping: round2(shipping),
      total: round2(taxableBase + tax + shipping),
    };
  };

  const openNew = () => { setForm({ ...EMPTY_QUOTE, items: [{ ...EMPTY_ITEM }] }); setDlgOpen(true); };
  const openEdit = (q) => {
    setForm({
      id: q.id,
      customerId: q.customerId || null,
      customerName: q.customerName || '', customerEmail: q.customerEmail || '', customerPhone: q.customerPhone || '',
      shippingAddress: q.shippingAddress || { line1: '', city: '', state: '', pincode: '' },
      items: (q.items || []).map(it => ({ ...it })),
      taxRate: q.taxRate ?? 5, shipping: q.shipping ?? 0, discount: q.discount ?? 0,
      notes: q.notes || '',
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : '',
    });
    setDlgOpen(true);
  };

  const setItem = (i, patch) => {
    const next = [...form.items];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, items: next });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const pickProduct = (i, productId) => {
    const p = (products?.items || []).find(x => x.id === productId);
    if (!p) return;
    setItem(i, { productId: p.id, name: p.name, price: p.price, unit: p.unit || 'pcs' });
  };

  const pickCustomer = (userId) => {
    const u = (users?.items || []).find(x => x.id === userId);
    if (!u) return;
    setForm({ ...form, customerId: u.id, customerName: u.name || '', customerEmail: u.email || '', customerPhone: u.phone || '' });
  };

  const saveQuote = async () => {
    if (!form.customerName || !form.customerEmail) return toast.error('Customer name and email required');
    const validItems = form.items.filter(it => it.name && Number(it.qty) > 0);
    if (validItems.length === 0) return toast.error('Add at least one line item');
    const body = { ...form, items: validItems, validUntil: form.validUntil || null };
    const url = form.id ? `/api/admin/quotations/${form.id}` : '/api/admin/quotations';
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success(form.id ? 'Quote updated' : `Quote ${d.number} created`);
    setDlgOpen(false);
    mutate();
  };

  const sendQuote = async (q) => {
    const res = await fetch(`/api/admin/quotations/${q.id}/send`, { method: 'POST' });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed to send');
    toast.success(d.emailSent ? `Emailed to ${q.customerEmail}` : 'Marked as sent (SMTP not configured)');
    mutate();
  };

  const setStatus = async (q, action) => {
    const res = await fetch(`/api/admin/quotations/${q.id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success(`Quote ${d.status}`);
    mutate();
  };

  const convertToOrder = async (q) => {
    if (!confirm(`Convert quote ${q.number} into a real order? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/quotations/${q.id}/convert`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success(`Created order ${d.orderId}`);
    mutate();
  };

  const deleteQuote = async (q) => {
    if (!confirm(`Delete quote ${q.number}?`)) return;
    const res = await fetch(`/api/admin/quotations/${q.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success('Deleted');
    mutate();
  };

  const downloadPdf = (q) => generateQuotationPdf(q);

  const previewTotals = computeTotals(form);

  return (
    <div className="space-y-4" data-testid="admin-quotations-panel">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Quotes', value: totals.count, color: 'from-stone-600 to-stone-800' },
          { label: 'Pending Acceptance', value: totals.pending, color: 'from-amber-600 to-amber-800' },
          { label: 'Accepted', value: totals.accepted, color: 'from-emerald-600 to-emerald-800' },
          { label: 'Converted', value: totals.converted, color: 'from-blue-600 to-blue-800' },
        ].map(s => (
          <Card key={s.label}><CardContent className={`p-4 text-white bg-gradient-to-br ${s.color} rounded`}>
            <div className="text-xs opacity-90">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Quote #, customer name, email" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" data-testid="quotes-search-input" />
          </div>
        </div>
        <div className="w-40">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="quotes-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="bg-emerald-700" data-testid="create-quote-btn"><Plus className="h-4 w-4 mr-1" />New Quotation</Button>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr>
              <th className="p-3 text-left">Quote #</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map(q => (
              <tr key={q.id} className="border-t border-border" data-testid={`quote-row-${q.id}`}>
                <td className="p-3 font-mono font-semibold">{q.number}</td>
                <td className="p-3"><div>{q.customerName}</div><div className="text-xs text-muted-foreground">{q.customerEmail}</div></td>
                <td className="p-3 text-muted-foreground">{q.items?.length || 0}</td>
                <td className="p-3 text-right font-semibold">{inr(q.total)}</td>
                <td className="p-3"><Badge className={`${STATUS_COLORS[q.status] || 'bg-stone-500'} text-white capitalize`}>{q.status}</Badge>{q.convertedToOrderId && <div className="text-[10px] font-mono text-blue-600 mt-1">→ {q.convertedToOrderId}</div>}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(q)} title="View" data-testid={`view-quote-${q.id}`}><Eye className="h-4 w-4" /></Button>
                  {['draft', 'sent'].includes(q.status) && <Button size="sm" variant="ghost" onClick={() => openEdit(q)} title="Edit"><Pencil className="h-4 w-4" /></Button>}
                  {['draft', 'sent'].includes(q.status) && <Button size="sm" variant="ghost" onClick={() => sendQuote(q)} title="Send Email" data-testid={`send-quote-${q.id}`}><Send className="h-4 w-4" /></Button>}
                  {['sent', 'draft'].includes(q.status) && <Button size="sm" variant="ghost" onClick={() => setStatus(q, 'accept')} title="Mark Accepted" data-testid={`accept-quote-${q.id}`}><Check className="h-4 w-4 text-emerald-700" /></Button>}
                  {['sent', 'draft'].includes(q.status) && <Button size="sm" variant="ghost" onClick={() => setStatus(q, 'reject')} title="Reject"><X className="h-4 w-4 text-red-600" /></Button>}
                  {q.status === 'accepted' && <Button size="sm" variant="ghost" onClick={() => convertToOrder(q)} title="Convert to Order" data-testid={`convert-quote-${q.id}`}><ArrowRight className="h-4 w-4 text-blue-600" /></Button>}
                  <Button size="sm" variant="ghost" onClick={() => downloadPdf(q)} title="Download PDF" data-testid={`pdf-quote-${q.id}`}><Download className="h-4 w-4" /></Button>
                  {['draft', 'rejected', 'expired'].includes(q.status) && <Button size="sm" variant="ghost" onClick={() => deleteQuote(q)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></Button>}
                </td>
              </tr>
            ))}
            {(data?.items || []).length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No quotations yet. Click &ldquo;New Quotation&rdquo; to create one.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>

      {/* Create / Edit Quote */}
      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? 'Edit Quotation' : 'New Quotation'}</DialogTitle></DialogHeader>

          <div className="space-y-4">
            {/* Customer */}
            <div>
              <div className="font-semibold text-sm mb-2">Customer</div>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-4">
                  <Label className="text-xs">Pick existing customer (optional)</Label>
                  <Select value={form.customerId || ''} onValueChange={pickCustomer}>
                    <SelectTrigger><SelectValue placeholder="Search and select a registered user" /></SelectTrigger>
                    <SelectContent>{(users?.items || []).filter(u => u.role !== 'admin').map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Name *</Label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} data-testid="quote-customer-name" /></div>
                <div><Label className="text-xs">Email *</Label><Input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} data-testid="quote-customer-email" /></div>
                <div><Label className="text-xs">Phone</Label><Input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} /></div>
                <div><Label className="text-xs">Valid Until</Label><Input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} /></div>
              </div>
            </div>

            {/* Shipping address (optional) */}
            <div>
              <div className="font-semibold text-sm mb-2">Shipping Address (used if converted to order)</div>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2"><Label className="text-xs">Address Line</Label><Input value={form.shippingAddress?.line1 || ''} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, line1: e.target.value } })} /></div>
                <div><Label className="text-xs">City</Label><Input value={form.shippingAddress?.city || ''} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, city: e.target.value } })} /></div>
                <div><Label className="text-xs">State</Label><Input value={form.shippingAddress?.state || ''} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, state: e.target.value } })} /></div>
                <div><Label className="text-xs">Pincode</Label><Input value={form.shippingAddress?.pincode || ''} onChange={e => setForm({ ...form, shippingAddress: { ...form.shippingAddress, pincode: e.target.value } })} /></div>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="font-semibold text-sm mb-2">Line Items</div>
              <div className="space-y-2">
                {form.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end border border-border rounded p-3" data-testid={`quote-item-row-${i}`}>
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Pick product</Label>
                      <Select value={it.productId || ''} onValueChange={(v) => pickProduct(i, v)}>
                        <SelectTrigger><SelectValue placeholder="(optional)" /></SelectTrigger>
                        <SelectContent>{(products?.items || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-6 sm:col-span-3"><Label className="text-xs">Item name *</Label><Input value={it.name} onChange={e => setItem(i, { name: e.target.value })} data-testid={`quote-item-name-${i}`} /></div>
                    <div className="col-span-3 sm:col-span-1"><Label className="text-xs">Qty</Label><Input type="number" value={it.qty} onChange={e => setItem(i, { qty: e.target.value })} data-testid={`quote-item-qty-${i}`} /></div>
                    <div className="col-span-3 sm:col-span-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={it.unit} onValueChange={(v) => setItem(i, { unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['pcs', 'box', 'pack', ...UNIT_OPTIONS].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4 sm:col-span-2"><Label className="text-xs">Price (₹)</Label><Input type="number" value={it.price} onChange={e => setItem(i, { price: e.target.value })} data-testid={`quote-item-price-${i}`} /></div>
                    <div className="col-span-4 sm:col-span-1"><Label className="text-xs">Total</Label><div className="h-9 px-2 grid place-items-end justify-start text-sm font-semibold">{inr((Number(it.qty)||0) * (Number(it.price)||0))}</div></div>
                    <div className="col-span-4 sm:col-span-1 flex justify-end"><Button size="sm" variant="ghost" onClick={() => removeItem(i)} disabled={form.items.length <= 1}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
                    <div className="col-span-12"><Label className="text-xs">Description / notes (optional)</Label><Input value={it.description} onChange={e => setItem(i, { description: e.target.value })} /></div>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={addItem} className="mt-2" data-testid="quote-add-item-btn"><Plus className="h-4 w-4 mr-1" />Add another item</Button>
            </div>

            {/* Charges */}
            <div className="grid sm:grid-cols-3 gap-3 border-t border-border pt-4">
              <div><Label className="text-xs">Discount (₹)</Label><Input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></div>
              <div><Label className="text-xs">Tax rate (%)</Label><Input type="number" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} /></div>
              <div><Label className="text-xs">Shipping (₹)</Label><Input type="number" value={form.shipping} onChange={e => setForm({ ...form, shipping: e.target.value })} /></div>
            </div>

            <div><Label className="text-xs">Notes / Terms</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Validity, payment terms, etc." /></div>

            {/* Totals preview */}
            <div className="bg-secondary/40 rounded p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{inr(previewTotals.subtotal)}</span></div>
              {previewTotals.discount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>− {inr(previewTotals.discount)}</span></div>}
              <div className="flex justify-between"><span>Tax ({form.taxRate}%)</span><span>{inr(previewTotals.tax)}</span></div>
              {previewTotals.shipping > 0 && <div className="flex justify-between"><span>Shipping</span><span>{inr(previewTotals.shipping)}</span></div>}
              <div className="flex justify-between font-bold text-emerald-700 border-t border-border pt-1.5 mt-1.5"><span>Grand Total</span><span>{inr(previewTotals.total)}</span></div>
            </div>

            <Button onClick={saveQuote} className="w-full bg-emerald-700" data-testid="save-quote-btn">{form.id ? 'Save Changes' : 'Create Quotation'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewing && <ViewQuote q={viewing} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ViewQuote({ q }) {
  return (
    <>
      <DialogHeader><DialogTitle>{q.number} · <Badge className={`${STATUS_COLORS[q.status] || 'bg-stone-500'} text-white capitalize ml-2`}>{q.status}</Badge></DialogTitle></DialogHeader>
      <div className="space-y-3 text-sm">
        <div className="bg-secondary/40 rounded p-3">
          <div className="font-semibold">{q.customerName}</div>
          <div className="text-xs text-muted-foreground">{q.customerEmail} {q.customerPhone ? `· ${q.customerPhone}` : ''}</div>
          {q.shippingAddress?.line1 && <div className="text-xs mt-1">{q.shippingAddress.line1}, {q.shippingAddress.city}, {q.shippingAddress.state} - {q.shippingAddress.pincode}</div>}
        </div>
        <table className="w-full text-xs border border-border">
          <thead className="bg-secondary/60"><tr><th className="p-2 text-left">Item</th><th className="p-2">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Total</th></tr></thead>
          <tbody>
            {q.items.map((it, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-2">{it.name}{it.description ? <div className="text-[10px] text-muted-foreground">{it.description}</div> : ''}</td>
                <td className="p-2 text-center">{it.qty} {it.unit}</td>
                <td className="p-2 text-right">{inr(it.price)}</td>
                <td className="p-2 text-right">{inr(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right space-y-0.5 text-xs">
          <div>Subtotal: <strong>{inr(q.subtotal)}</strong></div>
          {q.discount > 0 && <div className="text-red-600">Discount: −{inr(q.discount)}</div>}
          <div>Tax ({q.taxRate}%): <strong>{inr(q.tax)}</strong></div>
          {q.shipping > 0 && <div>Shipping: <strong>{inr(q.shipping)}</strong></div>}
          <div className="text-lg font-bold text-emerald-700">Total: {inr(q.total)}</div>
        </div>
        {q.notes && <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-600 p-3 text-xs"><em>{q.notes}</em></div>}
        {q.convertedToOrderId && <div className="text-xs text-blue-700">Converted to order <span className="font-mono">{q.convertedToOrderId}</span></div>}
        {q.history?.length > 0 && (
          <div className="text-xs">
            <div className="font-semibold mb-1">History</div>
            <ul className="space-y-1">
              {q.history.map((h, i) => (
                <li key={i} className="text-muted-foreground">• <span className="capitalize">{h.status}</span> by {h.by || '—'} on {new Date(h.at).toLocaleString()}{h.note ? ` — ${h.note}` : ''}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

function generateQuotationPdf(q) {
  const doc = new jsPDF({ unit: 'pt' });
  const left = 40, right = 555;
  let y = 50;
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(21, 128, 61);
  doc.text(COMPANY.name.toUpperCase(), left, y);
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(80);
  doc.text(COMPANY.addressLine, left, y + 14);
  doc.text(`Email: ${COMPANY.supportEmail}  ·  Ph: ${COMPANY.phoneDisplay}`, left, y + 26);
  doc.text(`GSTIN: ${COMPANY.gstin}  ·  FSSAI: ${COMPANY.fssai}`, left, y + 38);

  doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(0);
  doc.text('QUOTATION', right, y, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(10);
  doc.text(`#${q.number}`, right, y + 14, { align: 'right' });
  doc.text(`Date: ${new Date(q.createdAt).toLocaleDateString('en-IN')}`, right, y + 28, { align: 'right' });
  if (q.validUntil) doc.text(`Valid until: ${new Date(q.validUntil).toLocaleDateString('en-IN')}`, right, y + 42, { align: 'right' });

  y += 80;
  doc.setFont('helvetica', 'bold').setFontSize(10).text('Quoted To:', left, y);
  doc.setFont('helvetica', 'normal').setFontSize(10);
  doc.text(q.customerName, left, y + 14);
  doc.text(q.customerEmail, left, y + 28);
  if (q.customerPhone) doc.text(q.customerPhone, left, y + 42);
  if (q.shippingAddress?.line1) {
    const addr = `${q.shippingAddress.line1}, ${q.shippingAddress.city}, ${q.shippingAddress.state} - ${q.shippingAddress.pincode}`;
    doc.text(addr, left, y + 56, { maxWidth: 260 });
  }

  y += 80;
  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Qty', 'Unit', 'Price', 'Total']],
    body: q.items.map((it, i) => [
      String(i + 1),
      it.name + (it.description ? `\n${it.description}` : ''),
      String(it.qty),
      it.unit || 'pcs',
      inrPdf(it.price),
      inrPdf(it.total),
    ]),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [21, 128, 61], textColor: 255 },
    columnStyles: { 0: { cellWidth: 25 }, 4: { halign: 'right' }, 5: { halign: 'right' } },
  });

  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(10).setFont('helvetica', 'normal');
  const rightX = right;
  const rows = [
    ['Subtotal:', inrPdf(q.subtotal)],
    ...(q.discount > 0 ? [[`Discount:`, `- ${inrPdf(q.discount)}`]] : []),
    [`Tax (${q.taxRate}%):`, inrPdf(q.tax)],
    ...(q.shipping > 0 ? [['Shipping:', inrPdf(q.shipping)]] : []),
  ];
  rows.forEach((r, i) => {
    doc.text(r[0], rightX - 120, finalY + i * 16, { align: 'right' });
    doc.text(r[1], rightX, finalY + i * 16, { align: 'right' });
  });
  const grandY = finalY + rows.length * 16 + 6;
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(21, 128, 61);
  doc.text('Grand Total:', rightX - 120, grandY, { align: 'right' });
  doc.text(inrPdf(q.total), rightX, grandY, { align: 'right' });

  if (q.notes) {
    doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(80);
    doc.text('Notes / Terms:', left, grandY + 24);
    doc.setFont('helvetica', 'normal').text(q.notes, left, grandY + 38, { maxWidth: 500 });
  }

  doc.setFontSize(8).setTextColor(120).setFont('helvetica', 'normal');
  doc.text('This is a system-generated quotation. Subject to product availability at time of order.', left, 800);

  doc.save(`Quotation-${q.number}.pdf`);
}

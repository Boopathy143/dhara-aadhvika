'use client';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Printer, FileText, ArrowLeft, Plus, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { inr, inrPdf } from '@/lib/format';
import { COMPANY } from '@/lib/company';

export default function AdminLedger() {
  const { data: list } = useSWR('/api/admin/ledger/users');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = list?.items || [];
    if (!q) return items;
    return items.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [list, search]);

  if (selectedId) return <CustomerStatement userId={selectedId} onBack={() => setSelectedId(null)} />;

  const totals = (list?.items || []).reduce((acc, u) => {
    acc.outstanding += u.outstanding;
    acc.billed += u.totalBilled;
    acc.received += u.totalReceived;
    return acc;
  }, { outstanding: 0, billed: 0, received: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-700" />Customer Ledger</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Billed</div><div className="text-2xl font-bold mt-1">{inr(totals.billed)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Received</div><div className="text-2xl font-bold text-emerald-700 mt-1">{inr(totals.received)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Outstanding</div><div className={`text-2xl font-bold mt-1 ${totals.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{inr(totals.outstanding)}</div></CardContent></Card>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" data-testid="ledger-search" />
      </div>

      <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary/40"><tr>
          <th className="p-3 text-left">Customer</th>
          <th className="p-3 text-right">Orders</th>
          <th className="p-3 text-right">Billed</th>
          <th className="p-3 text-right">Received</th>
          <th className="p-3 text-right">Refunded</th>
          <th className="p-3 text-right">Outstanding</th>
          <th className="p-3"></th>
        </tr></thead>
        <tbody>{filtered.map(u => (
          <tr key={u.id} className="border-t border-border hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedId(u.id)} data-testid={`ledger-row-${u.id}`}>
            <td className="p-3"><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div>{!u.active && <Badge className="bg-red-500 text-white text-[10px] mt-1">Deactivated</Badge>}</td>
            <td className="p-3 text-right">{u.activeOrders}<span className="text-xs text-muted-foreground"> / {u.lifetimeOrders}</span></td>
            <td className="p-3 text-right">{inr(u.totalBilled)}</td>
            <td className="p-3 text-right text-emerald-700">{inr(u.totalReceived)}</td>
            <td className="p-3 text-right text-stone-600">{inr(u.totalRefunded)}</td>
            <td className={`p-3 text-right font-semibold ${u.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`} data-testid={`ledger-outstanding-${u.id}`}>{inr(u.outstanding)}</td>
            <td className="p-3 text-right"><Button size="sm" variant="ghost"><FileText className="h-4 w-4" /></Button></td>
          </tr>
        ))}{filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No customers</td></tr>}</tbody>
      </table></CardContent></Card>
    </div>
  );
}

function CustomerStatement({ userId, onBack }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const q = from || to ? `?from=${from || ''}&to=${to || ''}` : '';
  const { data, mutate } = useSWR(`/api/admin/ledger/users/${userId}${q}`);
  const [adding, setAdding] = useState(false);
  const [entry, setEntry] = useState({ type: 'credit', amount: '', description: '', date: '' });

  if (!data) return <div className="py-8 text-center text-muted-foreground">Loading statement…</div>;
  const { user, openingBalance, totals, entries } = data;

  const addManual = async () => {
    if (!Number(entry.amount)) return toast.error('Amount required');
    const res = await fetch('/api/admin/ledger/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...entry, amount: Number(entry.amount) }) });
    if (!res.ok) return toast.error('Failed');
    toast.success('Manual entry added'); setAdding(false); setEntry({ type: 'credit', amount: '', description: '', date: '' }); mutate();
  };

  const deleteManual = async (id) => {
    if (!confirm('Delete this manual entry?')) return;
    await fetch(`/api/admin/ledger/entries/${id}`, { method: 'DELETE' });
    mutate();
  };

  const exportCSV = () => {
    const header = ['Date', 'Type', 'Kind', 'Ref', 'Description', 'Debit', 'Credit', 'Balance'];
    const rows = entries.map(e => [
      new Date(e.date).toLocaleDateString('en-IN'),
      e.type,
      e.kind,
      e.ref || '',
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.type === 'debit' ? e.amount : '',
      e.type === 'credit' ? e.amount : '',
      e.balance,
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ledger-${user.email}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(21, 128, 61);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(255); doc.setFont('helvetica', 'bold').setFontSize(18);
    doc.text(COMPANY.legalName, 14, 14);
    doc.setFontSize(9).setFont('helvetica', 'normal');
    doc.text('Customer Ledger Statement', 14, 21);
    doc.text(COMPANY.addressLine, 14, 27);
    doc.setTextColor(40);
    doc.setFontSize(11).setFont('helvetica', 'bold');
    doc.text(`Customer: ${user.name}`, 14, 42);
    doc.setFontSize(9).setFont('helvetica', 'normal');
    doc.text(`Email: ${user.email}`, 14, 47);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 52);
    if (data.filter.from || data.filter.to) {
      doc.text(`Period: ${data.filter.from ? new Date(data.filter.from).toLocaleDateString('en-IN') : '—'}  to  ${data.filter.to ? new Date(data.filter.to).toLocaleDateString('en-IN') : '—'}`, 14, 57);
    }
    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance']],
      body: [
        ...(openingBalance ? [[ '—', 'opening', 'Opening balance carried forward', openingBalance > 0 ? inrPdf(openingBalance) : '', openingBalance < 0 ? inrPdf(-openingBalance) : '', inrPdf(openingBalance) ]] : []),
        ...entries.map(e => [
          new Date(e.date).toLocaleDateString('en-IN'),
          e.kind,
          e.description,
          e.type === 'debit' ? inrPdf(e.amount) : '',
          e.type === 'credit' ? inrPdf(e.amount) : '',
          inrPdf(e.balance),
        ]),
      ],
      theme: 'striped',
      headStyles: { fillColor: [21, 128, 61], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    });
    let y = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold').setFontSize(10);
    doc.text(`Total Debit: ${inrPdf(totals.debit)}`, W - 14, y, { align: 'right' }); y += 6;
    doc.text(`Total Credit: ${inrPdf(totals.credit)}`, W - 14, y, { align: 'right' }); y += 6;
    doc.text(`Outstanding: ${inrPdf(totals.outstanding)}`, W - 14, y, { align: 'right' });
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(120);
    doc.text('All amounts in INR. "Rs." prefix used for cross-platform PDF compatibility.', 14, 285);
    doc.save(`Ledger-${user.email}-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="space-y-4" data-testid="ledger-statement">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Back to customers</Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Print</Button>
          <Button size="sm" variant="outline" onClick={exportCSV} data-testid="ledger-export-csv"><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          <Button size="sm" className="bg-emerald-700" onClick={exportPDF} data-testid="ledger-export-pdf"><FileText className="h-4 w-4 mr-1" />Export PDF</Button>
        </div>
      </div>

      <Card><CardContent className="p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-2xl font-bold">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email} • Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}</div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="text-center"><div className="text-xs text-muted-foreground">Debit</div><div className="font-semibold text-stone-700">{inr(totals.debit)}</div></div>
            <div className="text-center"><div className="text-xs text-muted-foreground">Credit</div><div className="font-semibold text-emerald-700">{inr(totals.credit)}</div></div>
            <div className="text-center"><div className="text-xs text-muted-foreground">Outstanding</div><div className={`font-bold ${totals.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`} data-testid="ledger-outstanding">{inr(totals.outstanding)}</div></div>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 flex items-end gap-3 flex-wrap">
        <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9" data-testid="ledger-from" /></div>
        <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9" data-testid="ledger-to" /></div>
        <Button size="sm" variant="outline" onClick={() => { setFrom(''); setTo(''); }}>Clear</Button>
        <Button size="sm" className="ml-auto bg-emerald-700" onClick={() => setAdding(true)} data-testid="ledger-add-entry"><Plus className="h-4 w-4 mr-1" />Add Manual Entry</Button>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary/40"><tr>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Kind</th>
          <th className="p-3 text-left">Description</th>
          <th className="p-3 text-right">Debit</th>
          <th className="p-3 text-right">Credit</th>
          <th className="p-3 text-right">Balance</th>
          <th className="p-3"></th>
        </tr></thead>
        <tbody>
          {!!openingBalance && (
            <tr className="border-t border-border bg-secondary/20">
              <td className="p-3 italic text-muted-foreground">—</td>
              <td className="p-3"><Badge variant="outline" className="text-[10px]">opening</Badge></td>
              <td className="p-3 italic text-muted-foreground">Opening balance carried forward</td>
              <td className="p-3 text-right">{openingBalance > 0 ? inr(openingBalance) : ''}</td>
              <td className="p-3 text-right">{openingBalance < 0 ? inr(-openingBalance) : ''}</td>
              <td className="p-3 text-right font-medium">{inr(openingBalance)}</td>
              <td></td>
            </tr>
          )}
          {entries.map(e => (
            <tr key={e.id} className="border-t border-border">
              <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.date).toLocaleDateString('en-IN')}</td>
              <td className="p-3"><Badge variant="outline" className={`text-[10px] ${e.kind === 'order' ? 'border-amber-500 text-amber-700' : e.kind === 'payment' ? 'border-emerald-500 text-emerald-700' : e.kind === 'refund' ? 'border-stone-500' : 'border-indigo-500 text-indigo-700'}`}>{e.kind}</Badge></td>
              <td className="p-3">{e.description}</td>
              <td className="p-3 text-right text-stone-700">{e.type === 'debit' ? inr(e.amount) : ''}</td>
              <td className="p-3 text-right text-emerald-700">{e.type === 'credit' ? inr(e.amount) : ''}</td>
              <td className={`p-3 text-right font-medium ${e.balance > 0 ? 'text-amber-700' : e.balance < 0 ? 'text-emerald-700' : ''}`}>{inr(e.balance)}</td>
              <td className="p-3">{e.kind === 'manual' && <Button size="sm" variant="ghost" onClick={() => deleteManual(e.id)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}</td>
            </tr>
          ))}
          {entries.length === 0 && !openingBalance && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No entries in this period</td></tr>}
        </tbody>
      </table></CardContent></Card>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Manual Ledger Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={entry.type} onValueChange={v => setEntry({ ...entry, type: v })}>
                  <SelectTrigger data-testid="ledger-entry-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit — customer owes</SelectItem>
                    <SelectItem value="credit">Credit — payment / adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount (₹)</Label><Input type="number" value={entry.amount} onChange={e => setEntry({ ...entry, amount: e.target.value })} data-testid="ledger-entry-amount" /></div>
            </div>
            <div><Label>Date (optional)</Label><Input type="date" value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={2} value={entry.description} onChange={e => setEntry({ ...entry, description: e.target.value })} placeholder="e.g. Opening balance, Manual COD collected, Write-off" data-testid="ledger-entry-desc" /></div>
            <Button onClick={addManual} className="w-full bg-emerald-700" data-testid="ledger-entry-save">Save Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

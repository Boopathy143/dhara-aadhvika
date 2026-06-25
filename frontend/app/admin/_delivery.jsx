'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Save, Trash2, Search, Upload, MapPin, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { inr } from '@/lib/format';

export default function AdminDelivery() {
  const { data, mutate: refetch } = useSWR('/api/admin/delivery');
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newPin, setNewPin] = useState({ pincode: '', distanceKm: 0, deliverable: true, city: '', state: 'Tamil Nadu' });
  const [bulk, setBulk] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [testPin, setTestPin] = useState('');
  const [testResult, setTestResult] = useState(null);

  if (data && !settings) {
    // initialize editable settings copy once data arrives
    setSettings({
      storePincode: data.settings.storePincode,
      freeDeliveryThreshold: data.settings.freeDeliveryThreshold,
      notDeliverableLabel: data.settings.notDeliverableLabel || 'Beyond delivery range',
      fallbackPolicy: data.settings.fallbackPolicy || 'block',
      slabs: (data.settings.slabs || []).map(s => ({ ...s })),
    });
  }
  if (!data || !settings) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;

  const pincodes = data.pincodes || [];
  const filtered = search ? pincodes.filter(p => p.pincode.includes(search) || (p.city || '').toLowerCase().includes(search.toLowerCase())) : pincodes;

  const saveSettings = async () => {
    const slabs = settings.slabs.filter(s => Number.isFinite(Number(s.fromKm)) && Number.isFinite(Number(s.toKm))).map(s => ({ ...s, fromKm: Number(s.fromKm), toKm: Number(s.toKm), charge: Number(s.charge) || 0 }));
    const payload = { ...settings, slabs, freeDeliveryThreshold: Number(settings.freeDeliveryThreshold) || 0 };
    const res = await fetch('/api/admin/delivery', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return toast.error('Failed to save');
    toast.success('Delivery settings updated'); refetch();
  };

  const addSlab = () => setSettings({ ...settings, slabs: [...settings.slabs, { fromKm: 0, toKm: 0, charge: 0, label: '' }] });
  const removeSlab = (i) => setSettings({ ...settings, slabs: settings.slabs.filter((_, idx) => idx !== i) });
  const updateSlab = (i, k, v) => setSettings({ ...settings, slabs: settings.slabs.map((s, idx) => idx === i ? { ...s, [k]: v } : s) });

  const addPin = async () => {
    if (!newPin.pincode || newPin.pincode.length !== 6) return toast.error('Enter a 6-digit pincode');
    const res = await fetch('/api/admin/delivery/pincodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newPin, distanceKm: Number(newPin.distanceKm) }) });
    if (!res.ok) return toast.error('Failed');
    toast.success('PIN added'); setAdding(false); setNewPin({ pincode: '', distanceKm: 0, deliverable: true, city: '', state: 'Tamil Nadu' }); refetch();
  };
  const delPin = async (pincode) => {
    if (!confirm(`Delete PIN ${pincode}?`)) return;
    await fetch(`/api/admin/delivery/pincodes/${pincode}`, { method: 'DELETE' });
    refetch();
  };
  const importBulk = async () => {
    // Accepts CSV-ish lines: pincode,distanceKm,city,state[,deliverable=yes/no]
    const lines = bulk.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        pincode: parts[0],
        distanceKm: Number(parts[1] || 0),
        city: parts[2] || '',
        state: parts[3] || '',
        deliverable: parts[4] ? !/^(no|false|0)$/i.test(parts[4]) : true,
      };
    }).filter(p => p.pincode && p.pincode.length === 6);
    if (!items.length) return toast.error('No valid rows. Format: pincode,distanceKm,city,state');
    const res = await fetch('/api/admin/delivery/pincodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success(`Imported ${items.length} pincodes`); setShowBulk(false); setBulk(''); refetch();
  };
  const runTest = async () => {
    if (!testPin || testPin.length !== 6) return toast.error('Enter 6-digit PIN');
    const r = await fetch(`/api/delivery/quote?pincode=${testPin}&subtotal=500`);
    setTestResult(await r.json());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Truck className="h-5 w-5 text-emerald-700" />Distance-based Delivery</h2>
      </div>

      <Card><CardContent className="p-5 space-y-4">
        <h3 className="font-semibold text-sm">Store Origin & Free Delivery</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><Label>Store PIN code (origin)</Label><Input value={settings.storePincode} onChange={e => setSettings({ ...settings, storePincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} data-testid="delivery-store-pin" /></div>
          <div><Label>Free Delivery Threshold (₹)</Label><Input type="number" value={settings.freeDeliveryThreshold} onChange={e => setSettings({ ...settings, freeDeliveryThreshold: e.target.value })} placeholder="999" /></div>
          <div><Label>Unknown PIN policy</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={settings.fallbackPolicy?.startsWith('flat:') ? 'flat' : settings.fallbackPolicy} onChange={e => setSettings({ ...settings, fallbackPolicy: e.target.value === 'flat' ? 'flat:100' : 'block' })}>
              <option value="block">Block &mdash; show &ldquo;outside zone&rdquo;</option>
              <option value="flat">Charge flat fallback rate</option>
            </select>
            {settings.fallbackPolicy?.startsWith('flat:') && <Input className="mt-2" type="number" value={settings.fallbackPolicy.split(':')[1]} onChange={e => setSettings({ ...settings, fallbackPolicy: 'flat:' + (e.target.value || '0') })} placeholder="Fallback ₹" />}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm mt-4 mb-2">Distance slabs</h3>
          <div className="space-y-2">{settings.slabs.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_2fr_auto] gap-2 items-end" data-testid={`delivery-slab-${i}`}>
              <div><Label className="text-[10px]">From (km)</Label><Input type="number" value={s.fromKm} onChange={e => updateSlab(i, 'fromKm', e.target.value)} /></div>
              <div><Label className="text-[10px]">To (km)</Label><Input type="number" value={s.toKm} onChange={e => updateSlab(i, 'toKm', e.target.value)} /></div>
              <div><Label className="text-[10px]">Charge (₹)</Label><Input type="number" value={s.charge} onChange={e => updateSlab(i, 'charge', e.target.value)} /></div>
              <div><Label className="text-[10px]">Label</Label><Input value={s.label} onChange={e => updateSlab(i, 'label', e.target.value)} placeholder="0–5 KM" /></div>
              <Button size="sm" variant="ghost" onClick={() => removeSlab(i)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
            </div>
          ))}</div>
          <Button size="sm" variant="outline" onClick={addSlab} className="mt-2" data-testid="delivery-add-slab"><Plus className="h-4 w-4 mr-1" />Add slab</Button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={saveSettings} className="bg-emerald-700" data-testid="delivery-save-settings"><Save className="h-4 w-4 mr-2" />Save Settings</Button>
          <span className="text-xs text-muted-foreground">PIN codes beyond the highest slab show: {settings.notDeliverableLabel}</span>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">PIN Code → Distance Lookup ({pincodes.length})</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBulk(true)} data-testid="delivery-bulk-import"><Upload className="h-4 w-4 mr-1" />Bulk Import</Button>
            <Button size="sm" className="bg-emerald-700" onClick={() => setAdding(true)} data-testid="delivery-add-pin"><Plus className="h-4 w-4 mr-1" />Add PIN</Button>
          </div>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search PIN / city…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" data-testid="delivery-search" />
        </div>
        <div className="rounded-md border border-border overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 sticky top-0"><tr><th className="p-2 text-left">PIN</th><th className="p-2 text-left">Distance (km)</th><th className="p-2 text-left">City</th><th className="p-2 text-left">State</th><th className="p-2 text-left">Deliverable</th><th className="p-2"></th></tr></thead>
            <tbody>{filtered.map(p => (
              <tr key={p.pincode} className="border-t border-border" data-testid={`pin-row-${p.pincode}`}>
                <td className="p-2 font-mono">{p.pincode}</td>
                <td className="p-2">{p.distanceKm}</td>
                <td className="p-2">{p.city || '—'}</td>
                <td className="p-2">{p.state || '—'}</td>
                <td className="p-2">{p.deliverable === false ? <span className="text-red-600">No</span> : <span className="text-emerald-700">Yes</span>}</td>
                <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => delPin(p.pincode)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button></td>
              </tr>
            ))}{filtered.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>No PIN codes match</td></tr>}</tbody>
          </table>
        </div>
      </CardContent></Card>

      {/* PIN test */}
      <Card><CardContent className="p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-700" />Test a PIN code</h3>
        <div className="flex gap-2 max-w-md">
          <Input placeholder="Enter 6-digit PIN" value={testPin} maxLength={6} onChange={e => setTestPin(e.target.value.replace(/\D/g, '').slice(0, 6))} data-testid="delivery-test-pin" />
          <Button onClick={runTest} className="bg-emerald-700" data-testid="delivery-test-btn">Quote</Button>
        </div>
        {testResult && (
          <div className={`text-sm rounded-md border px-3 py-2 ${testResult.deliverable ? 'border-emerald-700/40 bg-emerald-700/5' : 'border-red-500/40 bg-red-500/5'}`} data-testid="delivery-test-result">
            {testResult.deliverable ? (
              <div>
                <div className="font-medium">{testResult.city || `PIN ${testPin}`} • {testResult.distanceKm} km</div>
                <div className="text-xs">{testResult.free ? 'FREE (above threshold)' : `${testResult.slab?.label || ''} — ${inr(testResult.charge)} delivery`}</div>
              </div>
            ) : <div className="font-medium text-red-700">Not deliverable — {testResult.message}</div>}
          </div>
        )}
      </CardContent></Card>

      {/* Add PIN dialog */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add PIN Code</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>PIN code (6 digits)</Label><Input maxLength={6} value={newPin.pincode} onChange={e => setNewPin({ ...newPin, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} data-testid="new-pin-code" /></div>
            <div><Label>Distance (km)</Label><Input type="number" value={newPin.distanceKm} onChange={e => setNewPin({ ...newPin, distanceKm: e.target.value })} data-testid="new-pin-distance" /></div>
            <div><Label>City</Label><Input value={newPin.city} onChange={e => setNewPin({ ...newPin, city: e.target.value })} /></div>
            <div><Label>State</Label><Input value={newPin.state} onChange={e => setNewPin({ ...newPin, state: e.target.value })} /></div>
            <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={newPin.deliverable} onChange={e => setNewPin({ ...newPin, deliverable: e.target.checked })} />Deliverable</label>
          </div>
          <Button className="w-full bg-emerald-700" onClick={addPin} data-testid="new-pin-save">Save PIN</Button>
        </DialogContent>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Bulk Import PIN Codes</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">One PIN per line. Format: <code>pincode,distanceKm,city,state,deliverable</code> (deliverable optional, defaults to yes).<br />Example:<br /><code className="text-[11px] block bg-secondary/40 rounded p-2 mt-1">638001,18,Erode,Tamil Nadu,yes<br />600001,450,Chennai,Tamil Nadu,yes</code></p>
          <Textarea rows={8} value={bulk} onChange={e => setBulk(e.target.value)} placeholder="638001,18,Erode,Tamil Nadu" data-testid="delivery-bulk-input" />
          <Button onClick={importBulk} className="w-full bg-emerald-700" data-testid="delivery-bulk-save">Import</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

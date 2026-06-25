'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AddressesPage() {
  const { data: me } = useSWR('/api/auth/me');
  const { data, mutate: refetch } = useSWR('/api/addresses');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
  if (!me?.user) return <><Header /><main className="container mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in required</h1></main><Footer /></>;
  const add = async () => {
    if (!form.name || !form.phone || !form.line1) return toast.error('Required fields missing');
    await fetch('/api/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
    setOpen(false); refetch(); toast.success('Address added');
  };
  const del = async (id) => { await fetch(`/api/addresses/${id}`, { method: 'DELETE' }); refetch(); toast.success('Removed'); };
  return (
    <><Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Saved Addresses</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-emerald-700"><Plus className="h-4 w-4 mr-1" />Add Address</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>New Address</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Full Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="col-span-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="col-span-2"><Label>Address</Label><Input value={form.line1} onChange={e => setForm({ ...form, line1: e.target.value })} /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
                <div className="col-span-2"><Label>Pincode</Label><Input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
              </div>
              <Button onClick={add} className="bg-emerald-700">Save Address</Button>
            </DialogContent>
          </Dialog>
        </div>
        {(data?.items?.length || 0) === 0 ? <div className="text-center py-16 text-muted-foreground">No saved addresses yet.</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{data.items.map(a => (
            <Card key={a.id}><CardContent className="p-5 space-y-2">
              <div className="flex items-start justify-between"><MapPin className="h-5 w-5 text-emerald-700" /><Button size="icon" variant="ghost" onClick={() => del(a.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
              <div className="font-semibold">{a.name}</div><div className="text-sm text-muted-foreground">{a.phone}</div>
              <div className="text-sm">{a.line1}<br />{a.city}, {a.state} - {a.pincode}</div>
            </CardContent></Card>
          ))}</div>
        )}
      </main><Footer />
    </>
  );
}

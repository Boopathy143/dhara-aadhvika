'use client';
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, MapPin, Lock, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPage() {
  const { data: me, mutate: refetchMe } = useSWR('/api/auth/me');
  const [name, setName] = useState('');
  const [oldP, setOldP] = useState(''); const [newP, setNewP] = useState('');
  useEffect(() => { if (me?.user?.name) setName(me.user.name); }, [me?.user?.name]);
  if (!me?.user) return <><Header /><main className="container mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in required</h1><Button asChild className="mt-4 bg-emerald-700"><Link href="/login">Sign in</Link></Button></main><Footer /></>;
  const saveProfile = async () => {
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (res.ok) { toast.success('Profile updated'); refetchMe(); }
  };
  const changePassword = async () => {
    if (newP.length < 6) return toast.error('Password must be 6+ characters');
    const res = await fetch('/api/profile/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword: oldP, newPassword: newP }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error);
    toast.success('Password changed'); setOldP(''); setNewP('');
  };
  return (
    <><Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-1">My Account</h1>
        <p className="text-muted-foreground mb-6">Welcome, {me.user.name}</p>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { i: Package, t: 'Orders', d: 'Track and manage', l: '/orders' },
            { i: MapPin, t: 'Addresses', d: 'Manage delivery info', l: '/account/addresses' },
            { i: User, t: 'Wishlist', d: 'Saved for later', l: '/wishlist' },
          ].map(({ i: I, t, d, l }) => (
            <Link key={t} href={l} className="block"><Card className="hover:border-emerald-700 transition"><CardContent className="p-5 flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-emerald-700/10 text-emerald-700 grid place-items-center"><I className="h-5 w-5" /></div><div><div className="font-semibold">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div></CardContent></Card></Link>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card><CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-emerald-700" />Profile</h2>
            <div><Label>Email</Label><Input value={me.user.email} disabled /></div>
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <Button onClick={saveProfile} className="bg-emerald-700">Save Changes</Button>
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Lock className="h-5 w-5 text-emerald-700" />Change Password</h2>
            <div><Label>Current Password</Label><Input type="password" value={oldP} onChange={e => setOldP(e.target.value)} /></div>
            <div><Label>New Password</Label><Input type="password" value={newP} onChange={e => setNewP(e.target.value)} /></div>
            <Button onClick={changePassword} className="bg-emerald-700">Update Password</Button>
          </CardContent></Card>
        </div>
      </main><Footer />
    </>
  );
}

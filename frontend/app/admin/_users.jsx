'use client';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pencil, KeyRound, Power, Search, History, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { inr } from '@/lib/format';

export default function AdminUsersPanel() {
  const { data: users, mutate } = useSWR('/api/admin/users');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [pwUser, setPwUser] = useState(null);
  const [pw, setPw] = useState('');
  const [detailsUser, setDetailsUser] = useState(null);
  const [details, setDetails] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = users?.items || [];
    if (!q) return items;
    return items.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, search]);

  const saveEdit = async () => {
    const res = await fetch(`/api/admin/users/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editing.name, email: editing.email, role: editing.role }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success('User updated'); setEditing(null); mutate();
  };
  const toggleActive = async (u) => {
    const newActive = u.active === false ? true : false;
    if (!newActive && !confirm(`Deactivate ${u.email}? They will not be able to log in.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: newActive }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success(newActive ? 'User activated' : 'User deactivated'); mutate();
  };
  const resetPwSubmit = async () => {
    if (!pw || pw.length < 6) return toast.error('Password must be 6+ characters');
    const res = await fetch(`/api/admin/users/${pwUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: pw }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success(`Password reset for ${pwUser.email}`); setPwUser(null); setPw('');
  };
  const del = async (u) => {
    if (!confirm(`Delete ${u.email}? This removes their cart, addresses and wishlist. Their orders will remain in the order history.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');
    toast.success('User deleted'); mutate();
  };
  const openDetails = async (u) => {
    setDetailsUser(u); setDetails(null);
    const res = await fetch(`/api/admin/users/${u.id}/details`);
    const d = await res.json();
    if (res.ok) setDetails(d);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" data-testid="user-search-input" />
        </div>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary/40"><tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Joined</th><th className="p-3"></th></tr></thead>
        <tbody>{filtered.map(u => (
          <tr key={u.id} className="border-t border-border" data-testid={`user-row-${u.id}`}>
            <td className="p-3">{u.name}</td>
            <td className="p-3">{u.email}</td>
            <td className="p-3"><Badge variant={u.role === 'admin' ? 'default' : 'outline'} className={u.role === 'admin' ? 'bg-amber-700' : ''}>{u.role}</Badge></td>
            <td className="p-3">{u.active === false ? <Badge className="bg-red-500 text-white">Deactivated</Badge> : <Badge className="bg-emerald-700 text-white">Active</Badge>}</td>
            <td className="p-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
            <td className="p-3 text-right whitespace-nowrap">
              <Button size="sm" variant="ghost" title="View activity" onClick={() => openDetails(u)} data-testid={`user-view-${u.id}`}><History className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" title="Edit" onClick={() => setEditing({ ...u })} data-testid={`user-edit-${u.id}`}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" title="Reset password" onClick={() => { setPwUser(u); setPw(''); }} data-testid={`user-reset-${u.id}`}><KeyRound className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" title={u.active === false ? 'Activate' : 'Deactivate'} onClick={() => toggleActive(u)} data-testid={`user-toggle-${u.id}`}><Power className={`h-4 w-4 ${u.active === false ? 'text-emerald-700' : 'text-amber-600'}`} /></Button>
              <Button size="sm" variant="ghost" title="Delete" onClick={() => del(u)} data-testid={`user-delete-${u.id}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>
            </td>
          </tr>
        ))}{filtered.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>No users match your search</td></tr>}</tbody>
      </table></CardContent></Card>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} data-testid="user-edit-name" /></div>
              <div><Label>Email</Label><Input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Role</Label>
                <Select value={editing.role} onValueChange={v => setEditing({ ...editing, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={saveEdit} className="w-full bg-emerald-700" data-testid="user-edit-save">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!pwUser} onOpenChange={(v) => !v && setPwUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          {pwUser && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Set a new password for <span className="font-medium text-foreground">{pwUser.email}</span>. Share the new password securely with the user.</p>
              <div><Label>New Password (min 6 chars)</Label><Input type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password" data-testid="user-reset-input" /></div>
              <Button onClick={resetPwSubmit} className="w-full bg-amber-700" data-testid="user-reset-submit">Reset Password</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activity / details */}
      <Dialog open={!!detailsUser} onOpenChange={(v) => !v && (setDetailsUser(null), setDetails(null))}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>User Activity</DialogTitle></DialogHeader>
          {detailsUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {detailsUser.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {detailsUser.email}</div>
                <div><span className="text-muted-foreground">Role:</span> {detailsUser.role}</div>
                <div><span className="text-muted-foreground">Joined:</span> {new Date(detailsUser.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><MapPin className="h-4 w-4" />Saved Addresses ({details?.addresses?.length || 0})</h4>
                <div className="space-y-1.5">{(details?.addresses || []).map(a => (
                  <div key={a.id} className="text-xs bg-secondary/40 rounded p-2"><span className="font-medium">{a.name}</span> • {a.phone} — {a.line1}, {a.city}, {a.state} - {a.pincode}</div>
                ))}{details && (details.addresses || []).length === 0 && <p className="text-xs text-muted-foreground">No saved addresses</p>}</div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><History className="h-4 w-4" />Order History ({details?.orders?.length || 0})</h4>
                <div className="space-y-1.5">{(details?.orders || []).map(o => (
                  <Link key={o.id} href={`/orders/${o.id}`} className="block text-xs bg-secondary/40 hover:bg-secondary/60 rounded p-2 flex items-center justify-between gap-3">
                    <span className="font-mono">{o.id}</span>
                    <span className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span>
                    <span>{o.items?.length} items</span>
                    <Badge variant="outline" className="capitalize text-[10px]">{(o.status || '').replace(/_/g, ' ')}</Badge>
                    <span className="font-semibold">{inr(o.total)}</span>
                  </Link>
                ))}{details && (details.orders || []).length === 0 && <p className="text-xs text-muted-foreground">No orders yet</p>}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

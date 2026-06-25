'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, ArrowUp, ArrowDown, Image as ImgIcon } from 'lucide-react';
import { toast } from 'sonner';

const empty = { title: '', subtitle: '', image: '', link: '/products', cta: 'Shop now', order: 1, active: true };

export default function AdminBanners() {
  const { data, mutate } = useSWR('/api/admin/banners');
  const [editing, setEditing] = useState(null);
  const items = data?.items || [];

  const openNew = () => setEditing({ ...empty, order: items.length + 1 });
  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) return toast.error('Banner image must be under 1.5 MB');
    if (!f.type.startsWith('image/')) return toast.error('Only image files');
    const r = new FileReader(); r.onload = () => setEditing({ ...editing, image: r.result }); r.readAsDataURL(f);
  };
  const save = async () => {
    if (!editing.title || !editing.image) return toast.error('Title and image are required');
    const isNew = !editing.id;
    const url = isNew ? '/api/admin/banners' : `/api/admin/banners/${editing.id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    if (!res.ok) return toast.error('Failed to save');
    toast.success('Banner saved'); setEditing(null); mutate();
  };
  const del = async (id) => {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    mutate();
  };
  const reorder = async (b, dir) => {
    const newOrder = (b.order || 0) + (dir === 'up' ? -1 : 1);
    await fetch(`/api/admin/banners/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: newOrder }) });
    mutate();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Homepage Banners</h2>
        <Button onClick={openNew} className="bg-emerald-700" data-testid="banner-new-btn"><Plus className="h-4 w-4 mr-2" />New Banner</Button>
      </div>
      <p className="text-sm text-muted-foreground">Manage the rotating hero slides on the homepage. Recommended size: 1600×600 px. PNG or JPG only.</p>
      {items.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground"><ImgIcon className="h-8 w-8 mx-auto opacity-50 mb-2" />No custom banners yet — the homepage uses the default hero slides.<br /><span className="text-xs">Add a banner to override the default hero carousel.</span></CardContent></Card>}
      <div className="grid sm:grid-cols-2 gap-3">{items.map(b => (
        <Card key={b.id} data-testid={`banner-card-${b.id}`}>
          <div className="relative aspect-[5/2] bg-secondary/30 overflow-hidden">
            <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
            {!b.active && <div className="absolute inset-0 bg-black/60 grid place-items-center text-white text-sm font-medium">Inactive</div>}
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-semibold">{b.title}</div><div className="text-xs text-muted-foreground">{b.subtitle}</div></div>
              <div className="text-xs text-muted-foreground">#{b.order}</div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => reorder(b, 'up')} title="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => reorder(b, 'down')} title="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing({ ...b })} data-testid={`banner-edit-${b.id}`}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => del(b.id)}><Trash2 className="h-3.5 w-3.5 mr-1 text-red-600" />Delete</Button>
            </div>
          </CardContent>
        </Card>
      ))}</div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Banner</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} data-testid="banner-title-input" /></div>
              <div><Label>Subtitle</Label><Textarea rows={2} value={editing.subtitle} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} /></div>
              <div><Label>Banner Image</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={editing.image && editing.image.startsWith('http') ? editing.image : ''} onChange={e => setEditing({ ...editing, image: e.target.value })} placeholder="Paste image URL" />
                  <label className="flex items-center justify-center gap-2 h-10 px-3 rounded-md border border-input bg-background cursor-pointer hover:border-emerald-700 transition text-sm"><Upload className="h-4 w-4" />Upload (max 1.5 MB)<input type="file" accept="image/*" onChange={onFile} className="hidden" /></label>
                </div>
                {editing.image && <img src={editing.image} alt="preview" className="mt-2 aspect-[5/2] w-full object-cover rounded border border-border" />}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>CTA Text</Label><Input value={editing.cta} onChange={e => setEditing({ ...editing, cta: e.target.value })} /></div>
                <div><Label>CTA Link</Label><Input value={editing.link} onChange={e => setEditing({ ...editing, link: e.target.value })} placeholder="/products" /></div>
                <div><Label>Order</Label><Input type="number" value={editing.order} onChange={e => setEditing({ ...editing, order: Number(e.target.value) })} /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 h-10"><input type="checkbox" checked={editing.active !== false} onChange={e => setEditing({ ...editing, active: e.target.checked })} />Active</label></div>
              </div>
              <Button onClick={save} className="w-full bg-emerald-700" data-testid="banner-save-btn">Save Banner</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

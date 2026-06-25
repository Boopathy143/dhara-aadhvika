'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, MessageCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.message) return toast.error('Email and message required');
    setSending(true);
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSending(false);
    if (res.ok) { toast.success('Message sent! We’ll get back to you soon.'); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }
    else toast.error('Could not send message');
  };
  return (
    <><Header />
      <main>
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-amber-700 text-white">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-200 font-semibold">We’d love to hear from you</div>
            <h1 className="text-3xl md:text-5xl font-bold mt-2">Get in Touch</h1>
            <p className="mt-2 max-w-2xl opacity-90">Questions about products, bulk orders, or just want to say hi? Drop us a line.</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 grid lg:grid-cols-[1fr_400px] gap-8">
          <Card><CardContent className="p-6"><form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Order, wholesale, support..." /></div>
            </div>
            <div><Label>Message *</Label><Textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={6} placeholder="How can we help?" /></div>
            <Button type="submit" disabled={sending} className="bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{sending ? 'Sending…' : 'Send Message'}</Button>
          </form></CardContent></Card>
          <div className="space-y-3">
            {[
              { i: Mail, t: 'Email', d: 'hello@dharaaadhvika.com', s: 'Replies within 24 hours' },
              { i: Phone, t: 'Phone & WhatsApp', d: '+91 98765 43210', s: 'Mon-Sat • 9 AM - 7 PM IST' },
              { i: MapPin, t: 'Address', d: 'Chennai, Tamil Nadu, India', s: 'Visit by appointment' },
              { i: MessageCircle, t: 'Bulk / Corporate', d: 'wholesale@dharaaadhvika.com', s: 'Custom hampers & pricing' },
              { i: Clock, t: 'Support Hours', d: 'Mon — Sat', s: '9:00 AM — 7:00 PM IST' },
            ].map(({ i: I, t, d, s }) => (
              <Card key={t}><CardContent className="p-4 flex gap-3 items-start">
                <div className="h-10 w-10 rounded-lg bg-emerald-700/10 text-emerald-700 grid place-items-center"><I className="h-5 w-5" /></div>
                <div><div className="font-semibold text-sm">{t}</div><div className="text-sm">{d}</div><div className="text-xs text-muted-foreground">{s}</div></div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      </main><Footer />
    </>
  );
}

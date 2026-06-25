'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Share2, FileText, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { COMPANY } from '@/lib/company';

// Default content blocks. Used as fallback whenever the corresponding key in
// site_settings.content is empty. Admin can override any of these from the UI.
const DEFAULT_CONTENT = {
  homeHeroTitle: 'Pure. Honest. Rooted.',
  homeHeroSubtitle: 'Premium organic foods sourced directly from Indian villages — the way our ancestors intended.',
  homeAboutTitle: 'From our family farms to your kitchen',
  homeAboutBody: 'Every product is hand-picked, traditionally processed, and shipped with love. No additives, no shortcuts — just the real taste of India.',
  about: 'Dhara Aadhvika is a family-owned organic food brand dedicated to bringing the authentic taste of Indian villages to modern kitchens. We work directly with small farmers, use traditional cold-pressing and stone-grinding methods, and never compromise on purity.',
  contactIntro: 'Have a question, a wholesale enquiry, or just want to say hello? We typically respond within 24 hours.',
  termsAndConditions: 'These terms and conditions govern your use of the Dhara Aadhvika website and the purchase of our products. By placing an order with us, you agree to these terms.\n\n1. ORDERS AND PRICES\nAll prices are listed in Indian Rupees (INR) and are inclusive of applicable GST. Prices are subject to change without notice.\n\n2. PAYMENT\nWe accept UPI and Cash-on-Delivery. UPI payments are verified manually within 24 hours.\n\n3. DELIVERY\nWe ship across India. Standard delivery takes 3–7 business days.',
  privacyPolicy: 'We respect your privacy. Personal information collected on this website is used solely to process your orders, communicate with you about our products, and improve our service.\n\nWe do not sell, trade, or share your personal data with third parties except as required to fulfill your order (e.g., shipping partners) or as required by law.',
  shippingPolicy: 'We ship pan-India with trusted courier partners.\n\nProcessing time: 1–2 business days\nDelivery time: 3–7 business days (longer for remote PIN codes)\nFree shipping on orders above ₹999\nFlat ₹49 shipping on orders below ₹999',
  refundPolicy: 'We stand behind every product we sell.\n\nReturns are accepted within 7 days of delivery for damaged, expired, wrong, or quality-defective products. Customer must raise a return request from the My Orders page with a photo proof.\n\nRefunds are processed within 5–7 business days to the original payment method after the returned product is received and inspected.',
};

const TEXT_KEYS = [
  ['homeHeroTitle', 'Home — Hero Title', false],
  ['homeHeroSubtitle', 'Home — Hero Subtitle', true],
  ['homeAboutTitle', 'Home — About Section Title', false],
  ['homeAboutBody', 'Home — About Section Body', true],
  ['about', 'About Page Content', true],
  ['contactIntro', 'Contact Page Intro', true],
  ['termsAndConditions', 'Terms & Conditions', true],
  ['privacyPolicy', 'Privacy Policy', true],
  ['shippingPolicy', 'Shipping Policy', true],
  ['refundPolicy', 'Refund Policy', true],
];

export default function AdminCMS() {
  const [settings, setSettings] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then((data) => {
      setSettings({
        company: { name: COMPANY.name, owner: COMPANY.owner, addressLine: COMPANY.addressLine, supportEmail: COMPANY.supportEmail, phoneDisplay: COMPANY.phoneDisplay, whatsapp: COMPANY.whatsapp, fssai: COMPANY.fssai, gstin: COMPANY.gstin, ...(data.company || {}) },
        socials: { ...COMPANY.socials, ...(data.socials || {}) },
        content: { ...DEFAULT_CONTENT, ...(data.content || {}) },
      });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setSaving(false);
    if (!res.ok) return toast.error('Failed to save');
    toast.success('Settings saved — site updated everywhere.');
  };

  if (!settings) return <div className="py-8 text-center text-muted-foreground">Loading settings…</div>;

  const setC = (k, v) => setSettings({ ...settings, company: { ...settings.company, [k]: v } });
  const setS = (k, v) => setSettings({ ...settings, socials: { ...settings.socials, [k]: v } });
  const setT = (k, v) => setSettings({ ...settings, content: { ...settings.content, [k]: v } });

  return (
    <Tabs defaultValue="company">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="company" data-testid="cms-tab-company"><Building2 className="h-3.5 w-3.5 mr-1.5" />Company Info</TabsTrigger>
        <TabsTrigger value="socials" data-testid="cms-tab-socials"><Share2 className="h-3.5 w-3.5 mr-1.5" />Social Links</TabsTrigger>
        <TabsTrigger value="content" data-testid="cms-tab-content"><FileText className="h-3.5 w-3.5 mr-1.5" />Page Content</TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="mt-4 space-y-3">
        <Card><CardContent className="p-5 grid sm:grid-cols-2 gap-4">
          <div><Label>Company Name</Label><Input value={settings.company.name} onChange={e => setC('name', e.target.value)} data-testid="cms-company-name" /></div>
          <div><Label>Proprietor / Owner</Label><Input value={settings.company.owner} onChange={e => setC('owner', e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Address (single line)</Label><Input value={settings.company.addressLine} onChange={e => setC('addressLine', e.target.value)} /></div>
          <div><Label>Support Email</Label><Input type="email" value={settings.company.supportEmail} onChange={e => setC('supportEmail', e.target.value)} data-testid="cms-company-email" /></div>
          <div><Label>WhatsApp Number (10 digits)</Label><Input value={settings.company.whatsapp} onChange={e => setC('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))} /></div>
          <div><Label>Display Phone</Label><Input value={settings.company.phoneDisplay} onChange={e => setC('phoneDisplay', e.target.value)} /></div>
          <div><Label>GST Number</Label><Input value={settings.company.gstin} onChange={e => setC('gstin', e.target.value.toUpperCase())} /></div>
          <div><Label>FSSAI Number</Label><Input value={settings.company.fssai} onChange={e => setC('fssai', e.target.value)} /></div>
        </CardContent></Card>
        <Button onClick={save} disabled={saving} className="bg-emerald-700" data-testid="cms-save-company"><Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : 'Save Company Info'}</Button>
      </TabsContent>

      <TabsContent value="socials" className="mt-4 space-y-3">
        <Card><CardContent className="p-5 grid sm:grid-cols-2 gap-4">
          <div><Label>Instagram URL</Label><Input value={settings.socials.instagram || ''} onChange={e => setS('instagram', e.target.value)} placeholder="https://instagram.com/..." data-testid="cms-social-instagram" /></div>
          <div><Label>Facebook URL</Label><Input value={settings.socials.facebook || ''} onChange={e => setS('facebook', e.target.value)} placeholder="https://facebook.com/..." data-testid="cms-social-facebook" /></div>
          <div><Label>YouTube URL</Label><Input value={settings.socials.youtube || ''} onChange={e => setS('youtube', e.target.value)} placeholder="https://youtube.com/@..." data-testid="cms-social-youtube" /></div>
          <div><Label>X (Twitter) URL</Label><Input value={settings.socials.twitter || ''} onChange={e => setS('twitter', e.target.value)} placeholder="https://x.com/..." data-testid="cms-social-twitter" /></div>
        </CardContent></Card>
        <Button onClick={save} disabled={saving} className="bg-emerald-700" data-testid="cms-save-socials"><Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : 'Save Social Links'}</Button>
      </TabsContent>

      <TabsContent value="content" className="mt-4 space-y-3">
        <p className="text-xs text-muted-foreground">Plain-text editor supports line breaks. Click &ldquo;Preview&rdquo; to see how it will render on the public site.</p>
        {TEXT_KEYS.map(([k, label, isLong]) => (
          <Card key={k}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Label>{label}</Label>
                <Button size="sm" variant="ghost" onClick={() => setPreviewKey(previewKey === k ? null : k)} data-testid={`cms-preview-${k}`}><Eye className="h-3.5 w-3.5 mr-1" />{previewKey === k ? 'Hide preview' : 'Preview'}</Button>
              </div>
              {isLong ? (
                <Textarea rows={6} value={settings.content[k] || ''} onChange={e => setT(k, e.target.value)} data-testid={`cms-input-${k}`} />
              ) : (
                <Input value={settings.content[k] || ''} onChange={e => setT(k, e.target.value)} data-testid={`cms-input-${k}`} />
              )}
              {previewKey === k && (
                <div className="mt-3 rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/40 p-4 whitespace-pre-line text-sm">
                  {settings.content[k] || <span className="text-muted-foreground italic">(empty)</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <Button onClick={save} disabled={saving} className="bg-emerald-700" data-testid="cms-save-content"><Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : 'Save Page Content'}</Button>
      </TabsContent>
    </Tabs>
  );
}

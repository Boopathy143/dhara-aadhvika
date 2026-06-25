'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Leaf, Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { COMPANY, WHATSAPP_LINK } from '@/lib/company';

export default function Footer() {
  const [email, setEmail] = useState('');
  const subscribe = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (res.ok) { toast.success('Subscribed! Welcome to the Dhara family.'); setEmail(''); }
    else toast.error('Please enter a valid email');
  };
  const socials = [
    { I: Instagram, href: COMPANY.socials.instagram, label: 'Instagram' },
    { I: Facebook, href: COMPANY.socials.facebook, label: 'Facebook' },
    { I: Twitter, href: COMPANY.socials.twitter, label: 'X (Twitter)' },
    { I: Youtube, href: COMPANY.socials.youtube, label: 'YouTube' },
  ];
  return (
    <footer className="mt-20 bg-gradient-to-br from-emerald-950 via-stone-900 to-amber-950 text-stone-200">
      <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 grid place-items-center"><Leaf className="h-5 w-5 text-white" /></div>
            <div><div className="font-extrabold tracking-tight text-white text-lg">DHARA AADHVIKA</div><div className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{COMPANY.tagline}</div></div>
          </div>
          <p className="text-stone-400 max-w-md">Premium organic foods sourced directly from Indian villages. Wood-pressed oils, ancient grains, hand-pounded rice and traditional herbs — the way our ancestors intended.</p>
          <form onSubmit={subscribe} className="mt-5 flex gap-2 max-w-sm">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" className="flex-1 h-10 px-3 rounded-md bg-stone-800 border border-stone-700 text-sm text-white" data-testid="newsletter-email-input" />
            <button className="h-10 px-4 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium" data-testid="newsletter-subscribe-btn">Subscribe</button>
          </form>
          <div className="flex gap-3 mt-5">
            {socials.map(({ I, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="h-9 w-9 grid place-items-center rounded-full bg-stone-800 hover:bg-emerald-700 transition" data-testid={`footer-social-${label.toLowerCase().split(' ')[0]}`}>
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Shop</h4>
          <ul className="space-y-2 text-stone-400">
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/products?category=cold-pressed-oils">Cold Pressed Oils</Link></li>
            <li><Link href="/products?category=millet-mix">Millets</Link></li>
            <li><Link href="/products?category=natural-sweeteners">Sweeteners</Link></li>
            <li><Link href="/products?category=herbal-products">Herbal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-2 text-stone-400">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/our-story">Our Story</Link></li>
            <li><Link href="/our-mission">Our Mission</Link></li>
            <li><Link href="/why-choose-us">Why Choose Us</Link></li>
            <li><Link href="/quality-promise">Quality Promise</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Help & Legal</h4>
          <ul className="space-y-2 text-stone-400">
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/support">Support Center</Link></li>
            <li><Link href="/shipping-policy">Shipping</Link></li>
            <li><Link href="/return-policy">Returns</Link></li>
            <li><Link href="/refund-policy">Refund</Link></li>
            <li><Link href="/cancellation-policy">Cancellation</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex flex-wrap gap-4">
            <a href={`mailto:${COMPANY.supportEmail}`} className="flex items-center gap-1.5 hover:text-amber-400" data-testid="footer-email"><Mail className="h-3.5 w-3.5" />{COMPANY.supportEmail}</a>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-amber-400" data-testid="footer-whatsapp"><Phone className="h-3.5 w-3.5" />WhatsApp {COMPANY.phoneDisplay}</a>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{COMPANY.address.city}, {COMPANY.address.state}, India</span>
          </div>
          <div>© {new Date().getFullYear()} {COMPANY.name} • Proprietor: {COMPANY.owner} • FSSAI Lic: {COMPANY.fssai}</div>
        </div>
      </div>
    </footer>
  );
}

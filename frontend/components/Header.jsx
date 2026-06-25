'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Heart, User, Sun, Moon, LogOut, LayoutDashboard, Package, MapPin, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
      <svg className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="dharaGrad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#15803d" /><stop offset="100%" stopColor="#a16207" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#dharaGrad)" />
        <path d="M24 10 C 18 16, 14 22, 14 28 C 14 34, 18 38, 24 38 C 30 38, 34 34, 34 28 C 34 22, 30 16, 24 10 Z" fill="white" opacity="0.95" />
        <path d="M24 14 L24 36" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 22 C 22 23, 22 25, 20 26" stroke="#15803d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M28 22 C 26 23, 26 25, 28 26" stroke="#15803d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[15px] sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent whitespace-nowrap">DHARA AADHVIKA</span>
        <span className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap">Pure • Honest • Rooted</span>
      </div>
    </Link>
  );
}

const NAV_LINKS = [
  { href: '/products', label: 'Shop All' },
  { href: '/products?bestSeller=1', label: 'Best Sellers' },
  { href: '/products?new=1', label: 'New Arrivals' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState('');
  const router = useRouter();
  useEffect(() => setMounted(true), []);
  const { data: me, mutate: refetchMe } = useSWR('/api/auth/me');
  const { data: cart } = useSWR('/api/cart');
  const { data: wl } = useSWR('/api/wishlist');
  const cartCount = cart?.items?.reduce((s, i) => s + i.qty, 0) || 0;
  const wlCount = wl?.items?.length || 0;

  const onSearch = (e) => { e.preventDefault(); if (q.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`); };
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); toast.success('Logged out'); refetchMe(); router.push('/'); };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-700 text-white text-[11px] sm:text-xs py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span>Free shipping on ₹999+ • COD available</span>
          <span className="hidden md:inline">FSSAI Certified • 100% Organic • No Chemicals</span>
        </div>
      </div>
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
        <Logo />
        <form onSubmit={onSearch} className="flex-1 max-w-xl hidden md:flex relative ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search organic foods, herbs, oils..." className="pl-10 h-10 bg-secondary/40" />
        </form>
        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="toggle theme">
            {mounted && theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative h-9 w-9 sm:h-10 sm:w-10"><Link href="/wishlist"><Heart className="h-4 w-4 sm:h-5 sm:w-5" />{wlCount > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{wlCount}</span>}</Link></Button>
          <Button variant="ghost" size="icon" asChild className="relative h-9 w-9 sm:h-10 sm:w-10"><Link href="/cart"><ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />{cartCount > 0 && <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{cartCount}</span>}</Link></Button>
          {me?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10"><User className="h-4 w-4 sm:h-5 sm:w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium border-b border-border mb-1">{me.user.name}<div className="text-xs text-muted-foreground font-normal">{me.user.email}</div></div>
                <DropdownMenuItem asChild><Link href="/account"><User className="h-4 w-4 mr-2" />My Account</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/orders"><Package className="h-4 w-4 mr-2" />My Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/account/addresses"><MapPin className="h-4 w-4 mr-2" />Addresses</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/wishlist"><Heart className="h-4 w-4 mr-2" />Wishlist</Link></DropdownMenuItem>
                {me.user.role === 'admin' && <DropdownMenuItem asChild><Link href="/admin"><LayoutDashboard className="h-4 w-4 mr-2" />Admin Panel</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="bg-gradient-to-r from-emerald-700 to-amber-700 text-white h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"><Link href="/login">Sign in</Link></Button>
          )}
          <Sheet><SheetTrigger asChild className="md:hidden"><Button variant="ghost" size="icon" className="h-9 w-9"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-72"><div className="flex flex-col gap-1 mt-6">{NAV_LINKS.map(l => (<Link key={l.href} href={l.href} className="px-3 py-2 rounded-md hover:bg-secondary">{l.label}</Link>))}</div></SheetContent>
          </Sheet>
        </nav>
      </div>
      <div className="hidden md:block border-t border-border">
        <div className="container mx-auto px-4 h-10 flex items-center gap-6 text-sm">{NAV_LINKS.map(l => (<Link key={l.href} href={l.href} className="text-foreground/80 hover:text-emerald-700 font-medium transition">{l.label}</Link>))}</div>
      </div>
      <form onSubmit={onSearch} className="md:hidden px-3 pb-3 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="pl-10 h-9 bg-secondary/40" />
      </form>
    </header>
  );
}

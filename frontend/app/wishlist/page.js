'use client';
import useSWR from 'swr';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { data, isLoading } = useSWR('/api/wishlist');
  const { data: me } = useSWR('/api/auth/me');
  if (!me?.user) return <><Header /><main className="container mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in to view your wishlist</h1><Button asChild className="mt-4"><Link href="/login">Sign in</Link></Button></main><Footer /></>;
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
        {isLoading ? <div className="animate-pulse h-48 bg-secondary/60 rounded" /> : (data?.items?.length || 0) === 0 ? (
          <div className="text-center py-16"><Heart className="h-12 w-12 mx-auto text-muted-foreground" /><p className="mt-3 text-muted-foreground">Your wishlist is empty</p><Button asChild className="mt-4"><Link href="/products">Browse Products</Link></Button></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{data.items.map(p => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </main>
      <Footer />
    </>
  );
}

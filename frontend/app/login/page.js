'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) {
      if (res.status === 403 && /verify your email/i.test(d.error || '')) {
        toast.error('Please verify your email first. Resending your verification code…');
        await fetch('/api/auth/resend-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        router.push(`/register?email=${encodeURIComponent(email)}&verify=1`);
        return;
      }
      toast.error(d.error); return;
    }
    toast.success('Welcome back!'); mutate('/api/auth/me');
    router.push(d.role === 'admin' ? '/admin' : '/');
  };
  const sendOtp = async () => {
    if (!otpEmail) { toast.error('Enter your email'); return; }
    setLoading(true);
    const res = await fetch('/api/auth/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: otpEmail }) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    setOtpSent(true);
    toast.success(d.message || 'OTP sent to your email');
  };
  const verifyOtp = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: otpEmail, code: otpCode }) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    toast.success('Signed in'); mutate('/api/auth/me');
    router.push(d.role === 'admin' ? '/admin' : '/');
  };

  return (
    <><Header />
      <main className="container mx-auto px-4 py-10 max-w-md">
        <Card><CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-4">Sign in to your Dhara Aadhvika account</p>
          <Tabs defaultValue="password">
            <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="password">Password</TabsTrigger><TabsTrigger value="otp">Email OTP</TabsTrigger></TabsList>
            <TabsContent value="password" className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
              <Button onClick={login} disabled={loading} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{loading ? 'Signing in…' : 'Sign in'}</Button>
              <div className="flex items-center justify-between text-xs">
                <Link href="/forgot-password" className="text-emerald-700 hover:underline">Forgot password?</Link>
                <Link href="/register" className="text-amber-700 hover:underline">Create an account</Link>
              </div>
            </TabsContent>
            <TabsContent value="otp" className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} disabled={otpSent} /></div>
              {!otpSent ? (<Button onClick={sendOtp} disabled={loading} className="w-full bg-emerald-700">{loading ? 'Sending…' : 'Send OTP'}</Button>) : (
                <>
                  <div><Label>Enter 6-digit code</Label><InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP></div>
                  <Button onClick={verifyOtp} disabled={loading || otpCode.length !== 6} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">Verify & Sign in</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setOtpSent(false); setOtpCode(''); }} className="w-full">Use different email</Button>
                </>
              )}
              <p className="text-xs text-muted-foreground text-center">We&apos;ll email you a 6-digit code to sign in securely.</p>
            </TabsContent>
          </Tabs>
        </CardContent></Card>
      </main><Footer />
    </>
  );
}

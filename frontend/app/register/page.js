'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { mutate } from 'swr';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

export default function RegisterPage() {
  return (
    <Suspense fallback={<><Header /><main className="container mx-auto px-4 py-10 max-w-md" /><Footer /></>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: '', email: searchParams.get('email') || '', password: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(searchParams.get('verify') === '1' && searchParams.get('email') ? 'otp' : 'form'); // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = (seconds = 30) => {
    setSecondsLeft(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { clearInterval(timerRef.current); return 0; } return s - 1; });
    }, 1000);
  };

  const submit = async () => {
    if (!form.email || !form.password) return toast.error('Email & password required');
    if (form.password.length < 6) return toast.error('Password must be 6+ characters');
    setLoading(true);
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) return toast.error(d.error);
    setStep('otp');
    startCooldown(30);
    toast.success(d.message || 'OTP sent to your email');
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    const res = await fetch('/api/auth/verify-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, code: otpCode }) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) return toast.error(d.error);
    toast.success('Welcome to the Dhara family!'); mutate('/api/auth/me'); router.push('/');
  };

  const resendOtp = async () => {
    if (secondsLeft > 0) return;
    setLoading(true);
    const res = await fetch('/api/auth/resend-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email }) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) return toast.error(d.error);
    startCooldown(30);
    toast.success(d.message || 'OTP resent');
  };

  return (
    <><Header />
      <main className="container mx-auto px-4 py-10 max-w-md">
        <Card><CardContent className="p-6 space-y-3">
          {step === 'form' ? (
            <>
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-sm text-muted-foreground">Join thousands of families eating cleaner.</p>
              <div><Label>Full Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              <Button onClick={submit} disabled={loading} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{loading ? 'Creating…' : 'Create Account'}</Button>
              <div className="text-sm text-center text-muted-foreground">Already have an account? <Link href="/login" className="text-emerald-700 font-medium">Sign in</Link></div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Verify your email</h1>
              <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-medium text-foreground">{form.email}</span>. It expires in 5 minutes.</p>
              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={verifyOtp} disabled={loading || otpCode.length !== 6} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{loading ? 'Verifying…' : 'Verify & Create Account'}</Button>
              <Button variant="ghost" size="sm" onClick={resendOtp} disabled={loading || secondsLeft > 0} className="w-full">
                {secondsLeft > 0 ? `Resend OTP in ${secondsLeft}s` : 'Resend OTP'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setStep('form'); setOtpCode(''); }} className="w-full text-muted-foreground">Use a different email</Button>
            </>
          )}
        </CardContent></Card>
      </main><Footer />
    </>
  );
}

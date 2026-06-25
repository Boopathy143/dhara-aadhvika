'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Could not send reset code');
    setSent(true);
    toast.success(d.message || 'If the email is registered, a reset code has been sent.');
  };

  const reset = async () => {
    if (code.length !== 6 || !newPass) return toast.error('Enter the 6-digit code and a new password');
    if (newPass.length < 6) return toast.error('Password must be 6+ characters');
    setLoading(true);
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, token: code, password: newPass }) });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Reset failed');
    toast.success('Password reset! Please sign in.');
    window.location.href = '/login';
  };

  return (
    <><Header />
      <main className="container mx-auto px-4 py-10 max-w-md">
        <Card><CardContent className="p-6 space-y-3">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          {!sent ? (
            <>
              <p className="text-sm text-muted-foreground">Enter your registered email and we&apos;ll email you a 6-digit reset code.</p>
              <div><Label>Email</Label><Input data-testid="forgot-email-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <Button data-testid="forgot-send-btn" onClick={send} disabled={loading} className="w-full bg-emerald-700">{loading ? 'Sending…' : 'Send Reset Code'}</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span> and your new password. Code expires in 30 minutes.</p>
              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                </InputOTP>
              </div>
              <div><Label>New Password</Label><Input data-testid="forgot-newpass-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
              <Button data-testid="forgot-reset-btn" onClick={reset} disabled={loading || code.length !== 6 || !newPass} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{loading ? 'Resetting…' : 'Reset Password'}</Button>
              <Button variant="ghost" size="sm" onClick={() => { setSent(false); setCode(''); setNewPass(''); }} className="w-full text-muted-foreground">Use a different email</Button>
            </>
          )}
          <div className="text-sm text-center"><Link href="/login" className="text-emerald-700 font-medium">Back to sign in</Link></div>
        </CardContent></Card>
      </main><Footer />
    </>
  );
}

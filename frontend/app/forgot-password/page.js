'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');
  const [newPass, setNewPass] = useState('');
  const [devToken, setDevToken] = useState('');
  const send = async () => {
    const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const d = await res.json();
    setSent(true);
    if (d.devToken) { setDevToken(d.devToken); setToken(d.devToken); }
    toast.success('If the email exists, a reset link/token has been sent.');
  };
  const reset = async () => {
    if (!token || !newPass) return toast.error('All fields required');
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: newPass }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error);
    toast.success('Password reset! Please sign in.'); window.location.href = '/login';
  };
  return (
    <><Header />
      <main className="container mx-auto px-4 py-10 max-w-md">
        <Card><CardContent className="p-6 space-y-3">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          {!sent ? (
            <>
              <p className="text-sm text-muted-foreground">Enter your registered email and we’ll send a reset token.</p>
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <Button onClick={send} className="w-full bg-emerald-700">Send Reset Token</Button>
              <p className="text-xs text-muted-foreground text-center">Email not configured — token will be displayed for testing. Add Resend/SMTP creds for real emails.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Enter the token sent to your email and your new password.</p>
              {devToken && <div className="text-xs p-2 rounded bg-amber-100 dark:bg-amber-900/30 break-all">Dev token: {devToken}</div>}
              <div><Label>Token</Label><Input value={token} onChange={e => setToken(e.target.value)} /></div>
              <div><Label>New Password</Label><Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
              <Button onClick={reset} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">Reset Password</Button>
            </>
          )}
          <div className="text-sm text-center"><Link href="/login" className="text-emerald-700 font-medium">Back to sign in</Link></div>
        </CardContent></Card>
      </main><Footer />
    </>
  );
}

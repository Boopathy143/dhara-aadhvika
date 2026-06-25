'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Upload, Copy, ShieldCheck, IndianRupee, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { UPI_ID, UPI_PAYEE, buildUpiLinks } from '@/lib/upi-config';

function Logo({ src, name, fallback, color }) {
  return (
    <a href={src} className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-emerald-700 hover:shadow-md transition">
      <div className={`h-10 w-10 grid place-items-center rounded-full text-white font-bold text-xs ${color}`}>{fallback}</div>
      <span className="text-xs font-medium">{name}</span>
    </a>
  );
}

export default function UpiPayment({ amount, orderNote, breakdown, onSubmit, submitting }) {
  const [qr, setQr] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null); // dataURL
  const [filename, setFilename] = useState('');
  const links = buildUpiLinks({ amount, note: orderNote });

  useEffect(() => {
    QRCode.toDataURL(links.upi, { errorCorrectionLevel: 'M', margin: 1, width: 280 }).then(setQr).catch(() => {});
  }, [links.upi]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    setFilename(f.name);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result);
    reader.readAsDataURL(f);
  };

  const submit = () => {
    if (!transactionId.trim()) return toast.error('Enter the UPI transaction ID');
    if (transactionId.trim().length < 6) return toast.error('Transaction ID looks too short');
    if (!screenshot) return toast.error('Upload your payment screenshot');
    onSubmit({ transactionId: transactionId.trim(), screenshot });
  };

  const copyUpi = () => { navigator.clipboard.writeText(UPI_ID); toast.success('UPI ID copied'); };
  const copyAmount = () => { navigator.clipboard.writeText(String(amount)); toast.success('Amount copied'); };

  return (
    <Card className="border-emerald-700/40">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" /><h3 className="font-semibold text-lg">Pay via UPI</h3></div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-700/10 to-amber-700/10 border border-emerald-700/30 p-5">
          <div className="grid md:grid-cols-2 gap-5 items-center">
            <div className="space-y-2 text-center md:text-left">
              <div className="text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-semibold">Pay To</div>
              <div className="text-xl font-bold">{UPI_PAYEE}</div>
              <button onClick={copyUpi} className="inline-flex items-center gap-1.5 text-sm font-mono bg-background border border-border rounded-md px-2.5 py-1 hover:border-emerald-700"><span>{UPI_ID}</span><Copy className="h-3 w-3" /></button>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Amount</span>
                <button onClick={copyAmount} className="inline-flex items-baseline gap-1 text-2xl font-bold text-emerald-700 hover:underline"><IndianRupee className="h-5 w-5" />{Number(amount).toLocaleString('en-IN')}</button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              {qr ? (
                <img src={qr} alt="UPI QR" className="h-44 w-44 rounded-lg bg-white p-2 border border-border" />
              ) : <div className="h-44 w-44 rounded-lg bg-secondary/40 animate-pulse" />}
              <p className="text-xs text-muted-foreground mt-2">Scan with any UPI app</p>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2 flex items-center gap-1.5"><Smartphone className="h-4 w-4" />Or pay using your favourite UPI app</div>
          <div className="grid grid-cols-4 gap-2">
            <Logo src={links.gpay} name="Google Pay" fallback="GPay" color="bg-gradient-to-br from-blue-500 to-green-500" />
            <Logo src={links.phonepe} name="PhonePe" fallback="PPe" color="bg-gradient-to-br from-purple-600 to-indigo-600" />
            <Logo src={links.paytm} name="Paytm" fallback="Ptm" color="bg-gradient-to-br from-sky-500 to-blue-700" />
            <Logo src={links.upi} name="Other UPI" fallback="UPI" color="bg-gradient-to-br from-emerald-600 to-amber-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">These open the respective UPI app on your phone with the amount pre-filled. On desktop, use the QR code from your phone.</p>
        </div>

        {breakdown && (
          <details className="rounded-md border border-border">
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium">Estimated invoice preview</summary>
            <div className="px-4 py-3 text-sm space-y-1 border-t border-border">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{breakdown.subtotal.toLocaleString('en-IN')}</span></div>
              {breakdown.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-₹{breakdown.discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between"><span>GST (5%)</span><span>₹{breakdown.tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{breakdown.shipping === 0 ? 'FREE' : `₹${breakdown.shipping}`}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-border"><span>Total payable</span><span>₹{breakdown.total.toLocaleString('en-IN')}</span></div>
            </div>
          </details>
        )}

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="text-sm font-semibold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-700" />After you've paid</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>UPI Transaction ID *</Label><Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. 4324923XXXX" /></div>
            <div>
              <Label>Payment Screenshot *</Label>
              <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background cursor-pointer hover:border-emerald-700 transition">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{filename || 'Choose image (max 2 MB)'}</span>
                <input type="file" accept="image/*" onChange={onFile} className="hidden" />
              </label>
            </div>
          </div>
          {screenshot && <img src={screenshot} alt="preview" className="h-32 rounded border border-border object-contain bg-secondary/30" />}
          <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-to-r from-emerald-700 to-amber-700 text-white">{submitting ? 'Submitting…' : 'Submit Payment for Verification'}</Button>
          <p className="text-xs text-muted-foreground">Your order will be placed with status <span className="font-semibold text-amber-700">Payment Verification Pending</span> until admin verifies the transaction.</p>
        </div>
      </CardContent>
    </Card>
  );
}

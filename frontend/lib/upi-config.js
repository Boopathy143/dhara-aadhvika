// UPI direct-payment configuration (also used on the client)
export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'boopathyboopathy298-6@okaxis';
export const UPI_PAYEE = process.env.NEXT_PUBLIC_UPI_PAYEE || 'Boopathy K';

export function buildUpiLinks({ amount, note }) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE,
    am: String(Number(amount).toFixed(2)),
    cu: 'INR',
    tn: (note || 'Dhara Aadhvika Order').slice(0, 60),
  });
  const q = params.toString();
  return {
    upi: `upi://pay?${q}`,
    gpay: `tez://upi/pay?${q}`,
    phonepe: `phonepe://pay?${q}`,
    paytm: `paytmmp://pay?${q}`,
  };
}

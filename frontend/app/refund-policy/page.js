'use client';
import ContentPage from '@/components/ContentPage';
export default function RefundPolicy() {
  return <ContentPage
    title="Refund Policy"
    subtitle="How and when you get your money back."
    sections={[
      { heading: 'Refund timelines', content: ['Prepaid orders (UPI / cards / wallet): 5-7 business days back to source.', 'COD orders: refund via bank transfer or UPI — we’ll ask for your details after return is received.'] },
      { heading: 'Partial refunds', content: 'If you ordered a multi-item bundle and only some items are returned, refund is pro-rated against the returned items’ share of the bundle price.' },
      { heading: 'Coupon refunds', content: 'If a coupon was used, the refund equals the amount actually paid (post-discount). The coupon itself cannot be reissued.' },
      { heading: 'Shipping refunds', content: 'Shipping is refunded only if the return is due to our error (wrong item, damaged in transit, quality issue). For change-of-mind returns, shipping is non-refundable.' },
      { heading: 'Cancellations before dispatch', content: '100% refund for orders cancelled before dispatch.' },
      { heading: 'Need help?', content: 'Email hello@dharaaadhvika.com or WhatsApp +91 98765 43210 with your order ID.' },
    ]}
  />;
}

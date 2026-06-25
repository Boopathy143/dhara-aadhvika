'use client';
import ContentPage from '@/components/ContentPage';
export default function ShippingPolicy() {
  return <ContentPage
    cmsKey="shippingPolicy"
    title="Shipping Policy"
    subtitle="Where, when and how we deliver your order."
    sections={[
      { heading: 'Where we ship', content: 'We currently ship to all serviceable pincodes within India. International shipping is not available yet.' },
      { heading: 'Shipping charges', content: ['Orders above ₹999: FREE shipping', 'Orders below ₹999: ₹49 flat rate', 'COD: same as prepaid — no extra COD charges'] },
      { heading: 'Delivery timelines', content: ['Metro cities: 2-4 business days', 'Tier-2 cities: 3-6 business days', 'Remote pincodes: 5-9 business days'] },
      { heading: 'Dispatch', content: 'Orders placed before 12:00 PM IST are typically dispatched the same business day. Orders after 12:00 PM ship the next business day. We do not dispatch on Sundays and national holidays.' },
      { heading: 'Tracking', content: 'Once shipped, you’ll receive an email and SMS with a tracking link. You can also track from “My Orders” on this site.' },
      { heading: 'Failed delivery', content: 'If the courier fails to deliver after 3 attempts, the parcel returns to us. We’ll contact you to confirm re-delivery (additional shipping may apply) or refund.' },
      { heading: 'Damaged in transit', content: 'If your package arrives damaged, refuse delivery or unbox on camera. Email us photos at hello@dharaaadhvika.com within 48 hours — we’ll arrange a free replacement.' },
    ]}
  />;
}

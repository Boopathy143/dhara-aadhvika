'use client';
import ContentPage from '@/components/ContentPage';
export default function Support() {
  return <ContentPage
    title="Support Center"
    subtitle="We're here to help, real humans on the other end."
    sections={[
      { heading: 'Reach us', content: ['Email: hello@dharaaadhvika.com', 'Phone / WhatsApp: +91 98765 43210', 'Hours: Mon-Sat • 9:00 AM — 7:00 PM IST', 'Address: Dhara Aadhvika Pvt. Ltd., Chennai, Tamil Nadu, India'] },
      { heading: 'Order help', content: 'Track your order from the “My Orders” section. For issues, share your order ID with our support team via WhatsApp — we typically respond within an hour.' },
      { heading: 'Product questions', content: 'Not sure what to buy? Want a personalised recommendation? WhatsApp us with your goals (weight loss, kids’ nutrition, diabetes-friendly, gifting, etc.) and we’ll suggest a starter pack.' },
      { heading: 'Wholesale and corporate gifting', content: 'Custom corporate hampers, festive boxes, bulk pricing for offices and stores — email hello@dharaaadhvika.com with your requirement.' },
    ]}
    cta={{ title: 'Quick contact form', text: 'Prefer to send us a message? Use our contact form and we’ll get back within 24 hours.', label: 'Go to Contact', href: '/contact' }}
  />;
}

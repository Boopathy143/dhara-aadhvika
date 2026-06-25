'use client';
import ContentPage from '@/components/ContentPage';
export default function ReturnPolicy() {
  return <ContentPage
    title="Return Policy"
    subtitle="Our 7-day, no-hassle return promise."
    sections={[
      { heading: 'Eligibility', content: ['Returns accepted within 7 days of delivery.', 'Product must be unopened, sealed and in original packaging.', 'For quality-related issues (taste, odour, foreign matter, opened in damaged state), we accept returns even on opened products with photo proof.'] },
      { heading: 'How to return', content: 'Email hello@dharaaadhvika.com with your order ID and reason. Our team will arrange a free reverse pickup within 48 hours.' },
      { heading: 'Non-returnable items', content: ['Custom / personalised hampers', 'Combo packs that have been partially used', 'Items past their best-before date'] },
      { heading: 'After return is received', content: 'Once we inspect the product (1-2 business days), we initiate the refund — see Refund Policy for timelines. If a replacement is preferred, we ship it the same day.' },
      { heading: 'Refused deliveries', content: 'If you refuse delivery at the door (e.g. damaged box), we treat it as a return and refund without any deductions.' },
    ]}
  />;
}

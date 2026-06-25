'use client';
import ContentPage from '@/components/ContentPage';
export default function FAQ() {
  return <ContentPage
    title="Frequently Asked Questions"
    subtitle="Quick answers about products, orders, returns and more."
    sections={[
      { heading: 'Are your products really organic?', content: 'Yes. Every product is sourced from certified organic farms and lab-tested for residues. We’re happy to share lab reports on request.' },
      { heading: 'How long does shipping take?', content: 'Metros: 2-4 business days. Other cities: 4-7 business days. You’ll get a tracking link as soon as your order ships.' },
      { heading: 'Do you ship internationally?', content: 'Currently we ship only within India. International shipping is on the roadmap.' },
      { heading: 'How do I cancel my order?', content: 'You can cancel any order from your “My Orders” page before it has been shipped. After shipment, please contact support.' },
      { heading: 'How do I return a product?', content: 'We accept returns within 7 days of delivery for unopened, sealed products. For opened products with quality issues, contact support — we’ll arrange a refund or replacement.' },
      { heading: 'What payment methods do you accept?', content: 'Cash on Delivery (COD) is available across India. Razorpay (cards, UPI, wallets) will be enabled shortly. UPI (GPay/PhonePe) is supported through Razorpay.' },
      { heading: 'Is Cash on Delivery available everywhere?', content: 'COD is available across all serviceable pincodes in India.' },
      { heading: 'Do you offer bulk / wholesale rates?', content: 'Yes — for orders above ₹10,000 we offer special pricing. Email hello@dharaaadhvika.com.' },
      { heading: 'How do I store your products at home?', content: 'Store in a cool, dry place. Flours and powders should be transferred to airtight containers. Oils last longest at room temperature, away from direct sunlight.' },
    ]}
  />;
}

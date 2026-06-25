'use client';
import ContentPage from '@/components/ContentPage';
export default function CancellationPolicy() {
  return <ContentPage
    title="Cancellation Policy"
    subtitle="Change of mind? Here’s how to cancel."
    sections={[
      { heading: 'Before dispatch', content: 'You can cancel any order from your “My Orders” page as long as the status is “Placed” or “Confirmed”. Full refund is issued.' },
      { heading: 'After dispatch', content: 'Once an order is shipped, it cannot be cancelled online. You may refuse delivery at the door, in which case the order is treated as a return.' },
      { heading: 'Cancelled by us', content: 'In rare cases (out of stock, pricing error, undeliverable pincode), we may need to cancel an order. We notify you immediately and issue a full refund within 24 hours.' },
      { heading: 'COD orders', content: 'COD orders can be cancelled until dispatch, same as prepaid. There is no penalty.' },
      { heading: 'Subscriptions (future)', content: 'When subscription orders go live, you’ll be able to pause, skip or cancel anytime from your account.' },
    ]}
  />;
}

'use client';
import ContentPage from '@/components/ContentPage';
export default function WhyChoose() {
  return <ContentPage
    title="Why Choose Dhara Aadhvika"
    subtitle="Six reasons families across India trust us with their daily nourishment."
    sections={[
      { heading: '1. Genuinely organic', content: 'Certified organic farms, no synthetic fertilisers, no pesticides, no GMO. Every batch is lab-tested before it leaves our warehouse.' },
      { heading: '2. Traditionally processed', content: 'Wood-pressed (chekku) oils. Stone-ground flours. Hand-pounded rice. Bilona ghee. We preserve the methods that preserve nutrition.' },
      { heading: '3. Direct from farmers', content: 'No middlemen. We pay our farmers up to 3x what they would get from local markets, and that lets them keep farming the right way.' },
      { heading: '4. Honest labelling', content: 'No fine print. No “natural flavours”. Every label tells you exactly what’s inside — and what isn’t.' },
      { heading: '5. Fast, careful delivery', content: 'Pan-India delivery in eco-friendly packaging. Glass and recycled materials wherever possible.' },
      { heading: '6. Real customer support', content: 'Talk to real humans — not chatbots. WhatsApp, email or phone. We’re here for you.' },
    ]}
    cta={{ title: 'Experience the difference yourself', text: 'Start with our best-sellers — a 100% satisfaction promise.', label: 'Shop Best Sellers', href: '/products?bestSeller=1' }}
  />;
}

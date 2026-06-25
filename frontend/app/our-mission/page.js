'use client';
import ContentPage from '@/components/ContentPage';
export default function OurMission() {
  return <ContentPage
    title="Our Mission"
    subtitle="Heal families through food. Empower farmers through fair trade. Protect traditions for the next generation."
    sections={[
      { heading: 'For families', content: 'Bring back foods that nourish the body and please the soul — made the slow, traditional way, packaged in clean materials, delivered with care.' },
      { heading: 'For farmers', content: 'Pay fair prices upfront, eliminate middlemen, provide year-round demand, and showcase the farmer’s story behind every product.' },
      { heading: 'For the planet', content: 'Choose regenerative organic agriculture, reusable packaging, and short supply chains. Every order should leave the earth a little healthier than before.' },
      { heading: 'Our north star', content: 'A future where every Indian family has affordable access to genuinely pure foods — and every small farmer earns enough to keep farming.' },
    ]}
  />;
}

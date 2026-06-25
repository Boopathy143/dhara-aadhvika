'use client';
import ContentPage from '@/components/ContentPage';
export default function QualityPromise() {
  return <ContentPage
    title="Our Quality Promise"
    subtitle="Every product passes through a 7-stage check before it reaches you."
    sections={[
      { heading: 'Stage 1 — Farmer selection', content: 'We only partner with farmers practising organic methods for 3+ years and willing to be inspected.' },
      { heading: 'Stage 2 — Soil and water testing', content: 'Annual independent lab tests for soil heavy metals and water purity.' },
      { heading: 'Stage 3 — Harvest', content: 'Hand-picked at peak ripeness. Sun-dried. No chemical curing.' },
      { heading: 'Stage 4 — Traditional processing', content: 'Wood pressing, stone grinding, bilona churning, slow roasting. Heat-free wherever possible.' },
      { heading: 'Stage 5 — Lab verification', content: 'Independent FSSAI-accredited labs verify each batch for purity, pesticide residues and adulteration.' },
      { heading: 'Stage 6 — Eco packaging', content: 'Food-grade glass, kraft paper and recyclable pouches. Plastic only where unavoidable, and always BPA-free.' },
      { heading: 'Stage 7 — Final taste test', content: 'A human tastes every batch. If it doesn’t make our team smile, it doesn’t make it to you.' },
      { heading: 'Our guarantee', content: 'If you’re ever unhappy with any product — even after opening it — we’ll refund or replace it. No questions asked.' },
    ]}
  />;
}

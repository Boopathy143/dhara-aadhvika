'use client';
import ContentPage from '@/components/ContentPage';
export default function About() {
  return <ContentPage
    title="About Dhara Aadhvika"
    subtitle="A premium organic food brand built on grandmother’s wisdom and farmer’s sweat."
    sections={[
      { heading: 'Who we are', content: 'Dhara Aadhvika is a homegrown Indian brand dedicated to bringing pure, traditional foods back to your dining table. Born out of a simple frustration — the foods we eat today don’t taste the way they used to — we set out to source, process and deliver ingredients the way our grandmothers knew them. No chemicals. No shortcuts. No additives.' },
      { heading: 'What we do', content: 'We work directly with small farmers and rural producers across Tamil Nadu, Kerala, Karnataka and beyond. From wood-pressed (chekku) oils, hand-pounded heirloom rice, stone-ground millet flours and bilona-method A2 ghee, every product passes through the same checks our own families would demand.' },
      { heading: 'Our promise to you', content: ['100% organic and chemical-free — verified through lab testing.', 'Fair pricing for farmers, fair pricing for you.', 'Traditional processing methods preserved.', 'Transparent sourcing — we tell you exactly where each product comes from.', 'Reusable, recyclable, eco-friendly packaging.'] },
      { heading: 'The Aadhvika family', content: 'Today, Dhara Aadhvika nourishes thousands of families across India. Every order we ship supports a small farmer and helps revive a forgotten food tradition. Thank you for being part of this journey.' },
    ]}
    cta={{ title: 'Ready to taste the difference?', text: 'Browse our curated collection of organic foods, handpicked from the heart of India.', label: 'Shop Now', href: '/products' }}
  />;
}

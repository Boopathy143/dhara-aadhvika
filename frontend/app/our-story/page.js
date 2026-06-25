'use client';
import ContentPage from '@/components/ContentPage';
export default function OurStory() {
  return <ContentPage
    title="Our Story"
    subtitle="From a forgotten kitchen recipe to a movement."
    sections={[
      { heading: 'It started in a village kitchen', content: 'In the summer of 2021, our founder visited her ancestral village in Tamil Nadu after a decade in the city. Her grandmother handed her a glass of palm-sprout health drink — and that first sip brought back a flood of childhood memories. Foods she had forgotten existed. Tastes that supermarket shelves could no longer give her.' },
      { heading: 'The realisation', content: 'Modern food had been stripped of its soul. Rice was polished beyond recognition. Oils were extracted with solvents. Spices were adulterated. The wisdom of generations was being lost to convenience. We knew we had to do something.' },
      { heading: 'Building the network', content: 'Over the next year, we travelled across South India, meeting farmers, oil-press operators, jaggery makers and herb cultivators. We learned, we tasted, we negotiated fair prices. Slowly, the Aadhvika network took shape — a constellation of small producers committed to doing things right.' },
      { heading: 'Today', content: 'Dhara Aadhvika is more than a brand. It’s a quiet rebellion against industrial food. It’s a way of saying ‘thank you’ to the farmers who keep our traditions alive. And it’s an invitation to every family to come back to real food.' },
    ]}
  />;
}

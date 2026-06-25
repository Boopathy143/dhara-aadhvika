'use client';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSlider() {
  const { data: slides = [] } = useSWR('/api/hero');
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!embla) return;
    const onSel = () => setSelected(embla.selectedScrollSnap());
    embla.on('select', onSel);
    const id = setInterval(() => embla.scrollNext(), 6000);
    return () => { embla.off('select', onSel); clearInterval(id); };
  }, [embla]);
  const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);
  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex">
          {slides.map((s) => (
            <div key={s.id} className="relative flex-[0_0_100%] aspect-[21/10] md:aspect-[21/8] bg-stone-200">
              <img src={s.image} alt={s.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-transparent" />
              <div className="relative h-full container mx-auto px-6 md:px-12 flex flex-col justify-center text-white max-w-3xl">
                <span className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full text-xs bg-amber-600/90 font-semibold tracking-wider uppercase">100% Organic • Village Sourced</span>
                <h1 className="mt-3 text-3xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow">{s.title}</h1>
                <p className="mt-3 text-base md:text-lg opacity-90 max-w-xl">{s.subtitle}</p>
                <Button asChild className="mt-6 w-fit bg-white text-emerald-900 hover:bg-stone-100 font-semibold"><Link href={s.link}>{s.cta}</Link></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-background/80 backdrop-blur shadow hover:bg-background"><ChevronLeft className="h-5 w-5" /></button>
      <button onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-background/80 backdrop-blur shadow hover:bg-background"><ChevronRight className="h-5 w-5" /></button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{slides.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === selected ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />)}</div>
    </div>
  );
}

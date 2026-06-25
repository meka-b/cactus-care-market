import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { useTemplates } from '@/contexts/TemplateContext';

export default function CategoryListModernCarousel({ categories }) {
  const { templates } = useTemplates() || {};
  // Determine if marquee is enabled (default true)
  const isMarqueeEnabled = templates?.CategoryList_marqueeEnabled ?? true;

  // Setup Embla plugins conditionally
  const plugins = isMarqueeEnabled ? [AutoScroll({ playOnInit: true, stopOnInteraction: false, speed: 1.5 })] : [];

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, // Always allow loop for better drag free experience, but auto-scroll relies on it
    dragFree: true,
    align: 'start'
  }, plugins);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback((api) => {
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const handleMouseEnter = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.stop();
  }, [emblaApi]);

  const handleMouseLeave = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.play();
  }, [emblaApi]);

  return (
    <section className="py-12 sm:py-16 bg-[#F8F9FA] overflow-hidden" data-testid="home-category-carousel">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold font-heading text-gray-900">Kategoriler</h2>
            <p className="text-gray-500 mt-1">İhtiyacına uygun bitkiyi hızlıca keşfet</p>
          </div>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Nav Prev */}
          <button 
            onClick={scrollPrev}
            className={`absolute left-0 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-opacity ${!isMarqueeEnabled && !canScrollPrev ? 'opacity-0 pointer-events-none' : 'opacity-0 lg:group-hover:opacity-100 hidden lg:flex'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="overflow-hidden cursor-grab active:cursor-grabbing px-2 py-4 -my-4" ref={emblaRef}>
            <div className="flex -ml-4">
              {categories.map((t, index) => {
                const Icon = t.icon;
                return (
                  <div key={`${t.slug}-${index}`} className="flex-none pl-4 w-[280px] sm:w-[320px]">
                    <Link to={`/k/${t.slug}`} className="block">
                      <div className="bg-white rounded-xl shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 transition-all duration-300 p-4 flex items-center justify-between group/card h-[100px]">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                            <Icon className="w-7 h-7 text-gray-600 group-hover/card:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                          </div>
                          <span className="font-semibold text-gray-900 text-lg group-hover/card:text-primary transition-colors line-clamp-2 leading-tight">{t.label}</span>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover/card:text-gray-900 transition-colors shrink-0" />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nav Next */}
          <button 
            onClick={scrollNext}
            className={`absolute right-0 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-opacity ${!isMarqueeEnabled && !canScrollNext ? 'opacity-0 pointer-events-none' : 'opacity-0 lg:group-hover:opacity-100 hidden lg:flex'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}

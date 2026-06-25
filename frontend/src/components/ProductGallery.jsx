import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { resolveImageUrl } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Responsive product gallery.
 * Mobile: Embla Carousel (swipe/drag) + synced thumbnail strip.
 * Desktop: First image hero (full width) + remaining images in 2-col grid.
 * All images use 4:5 aspect ratio (1080x1350 reference).
 */
export function ProductGallery({ images = [], productName = '' }) {
  const safeImages = images && images.length ? images : [{ main: '', thumb: '', alt: productName }];
  const [activeIdx, setActiveIdx] = useState(0);

  // Embla main carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [emblaThumbRef, emblaThumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps', dragFree: true, align: 'start',
  });

  const onThumbClick = useCallback((index) => {
    if (!emblaApi || !emblaThumbApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi, emblaThumbApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi || !emblaThumbApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setActiveIdx(idx);
    emblaThumbApi.scrollTo(idx);
  }, [emblaApi, emblaThumbApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect).on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <>
      {/* MOBILE: Embla Carousel + thumbnail strip */}
      <div className="lg:hidden" data-testid="product-gallery-mobile">
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[#F7FBF8]" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {safeImages.map((im, idx) => (
                <div className="flex-[0_0_100%] min-w-0" key={idx}>
                  <div className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
                    {im.main ? (
                      <img
                        src={resolveImageUrl(im.main)}
                        alt={im.alt || productName}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                      />
                    ) : <div className="absolute inset-0 shimmer" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {safeImages.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur grid place-items-center shadow disabled:opacity-50"
                disabled={activeIdx === 0}
                aria-label="Önceki görsel"
                data-testid="gallery-prev-button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur grid place-items-center shadow disabled:opacity-50"
                disabled={activeIdx === safeImages.length - 1}
                aria-label="Sonraki görsel"
                data-testid="gallery-next-button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/55 text-white text-[10px] font-medium px-2 py-0.5 rounded-full" data-testid="gallery-counter">
                {activeIdx + 1} / {safeImages.length}
              </div>
            </>
          )}
        </div>
        {/* Thumbnail strip */}
        {safeImages.length > 1 && (
          <div className="mt-3 overflow-hidden" ref={emblaThumbRef}>
            <div className="flex gap-2">
              {safeImages.map((im, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onThumbClick(idx)}
                  className={`flex-[0_0_22%] sm:flex-[0_0_16%] rounded-xl overflow-hidden border-2 ${activeIdx === idx ? 'border-primary' : 'border-transparent'}`}
                  aria-label={`Görsel ${idx + 1}`}
                  data-testid={`gallery-thumb-${idx}`}
                >
                  <div className="relative" style={{ aspectRatio: '4 / 5' }}>
                    <img src={resolveImageUrl(im.thumb || im.main)} alt={im.alt || productName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP: Hero (first) full width + remaining 2-col grid */}
      <div className="hidden lg:block" data-testid="product-gallery-desktop">
        {/* Hero */}
        <div className="rounded-xl overflow-hidden border border-[hsl(var(--border))] bg-[#F7FBF8]">
          <div className="relative" style={{ aspectRatio: '4 / 5' }}>
            {safeImages[0]?.main ? (
              <img
                src={resolveImageUrl(safeImages[0].main)}
                alt={safeImages[0].alt || productName}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            ) : <div className="absolute inset-0 shimmer" />}
          </div>
        </div>
        {/* Rest grid (2 columns) */}
        {safeImages.length > 1 && (
          <div className="grid grid-cols-2 gap-3 mt-3" data-testid="product-gallery-desktop-grid">
            {safeImages.slice(1).map((im, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-[hsl(var(--border))] bg-[#F7FBF8]">
                <div className="relative" style={{ aspectRatio: '4 / 5' }}>
                  <img
                    src={resolveImageUrl(im.main)}
                    alt={im.alt || productName}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

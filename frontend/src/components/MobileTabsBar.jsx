import React, { useCallback, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

/**
 * MobileTabsBar
 * Mobile-only horizontal tab navigation using Embla Carousel.
 * - No horizontal scrollbar (Embla handles overflow internally).
 * - Swipe / drag to reveal off-screen tabs.
 * - When a tab becomes active, it is auto-scrolled into the visible area.
 *
 * Props:
 *   tabs:   [{ value: string, label: string, testId?: string }]
 *   active: current active tab value
 *   onSelect: (value) => void
 */
export function MobileTabsBar({ tabs = [], active, onSelect }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: false,
  });

  const slideRefs = useRef([]);

  // Whenever active tab changes, ensure it is visible inside the Embla viewport.
  useEffect(() => {
    if (!emblaApi || !active) return;
    const idx = tabs.findIndex((t) => t.value === active);
    if (idx < 0) return;
    try {
      // First try Embla's own scrollTo for snapping behavior
      emblaApi.scrollTo(idx);
    } catch (_e) { /* noop */ }

    // Fallback: ensure the DOM node is visible in case scrollTo doesn't fully center long items.
    const node = slideRefs.current[idx];
    if (node && typeof node.scrollIntoView === 'function') {
      // Use 'nearest' so we don't yank the page vertically
      try {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch (_e) {
        node.scrollIntoView();
      }
    }
  }, [active, emblaApi, tabs]);

  const handleClick = useCallback((value) => {
    if (typeof onSelect === 'function') onSelect(value);
  }, [onSelect]);

  return (
    <div
      className="lg:hidden w-full"
      data-testid="mobile-tabs-bar"
    >
      <div
        ref={emblaRef}
        className="overflow-hidden bg-[hsl(var(--secondary))] rounded-xl p-1"
      >
        <div className="flex touch-pan-y gap-1">
          {tabs.map((t, i) => {
            const isActive = active === t.value;
            return (
              <button
                key={t.value}
                ref={(el) => { slideRefs.current[i] = el; }}
                type="button"
                onClick={() => handleClick(t.value)}
                className={[
                  'flex-[0_0_auto] whitespace-nowrap select-none',
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  isActive
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
                aria-pressed={isActive}
                data-state={isActive ? 'active' : 'inactive'}
                data-testid={t.testId || `mobile-tab-${t.value}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

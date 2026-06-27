import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHeroContent } from '@/hooks/useHeroContent';
import { ArrowRight } from 'lucide-react';

export default function HeroBannerInfiniteMarquee() {
  const { content, loading } = useHeroContent('InfiniteMarquee');

  useEffect(() => {
    if (content?.seoTitle) document.title = content.seoTitle;
    if (content?.seoDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = content.seoDescription;
    }
  }, [content]);

  if (loading) return <div className="h-96 flex items-center justify-center">Yükleniyor...</div>;

  const mainTitle = content?.mainTitle || content?.title || "Discover Exclusive\nDigital Collectibles";
  const subtitle = content?.subtitle || "Explore our NFT marketplace and discover a world where unique digital assets can be collected, traded, and cherished.";
  const ctaLabel = content?.primaryCtaLabel || "Start Collecting";
  const ctaLink = content?.primaryCtaLink || "/";

  const stat1Value = content?.stat1Value || "29K+";
  const stat1Label = content?.stat1Label || "Artwork";
  const stat2Value = content?.stat2Value || "34K+";
  const stat2Label = content?.stat2Label || "Auctions";
  const stat3Value = content?.stat3Value || "99K+";
  const stat3Label = content?.stat3Label || "Creators";

  const defaultImages = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400",
    "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=400",
    "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?q=80&w=400",
    "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=400"
  ];

  const items = content?.marqueeItems?.length > 0 ? content.marqueeItems : defaultImages.map(img => ({ type: 'url', image: img }));

  // Shuffle array randomly
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Build a column that contains all items shuffled, repeated if necessary to reach a minimum length.
  // Also prevents the boundary between repeats from having identical consecutive images (if possible).
  const buildRandomColumn = (baseItems, minLength) => {
    if (baseItems.length === 0) return [];
    let col = [];
    // Ensure we run the loop at least once so all items are included
    while (col.length < Math.max(minLength, baseItems.length)) {
      let batch = shuffle(baseItems);
      // Prevent consecutive identical images at the boundary if we have at least 2 distinct items
      if (col.length > 0 && batch.length > 1) {
        if (col[col.length - 1].image === batch[0].image) {
          // Swap first and second element of the batch
          [batch[0], batch[1]] = [batch[1], batch[0]];
        }
      }
      col = [...col, ...batch];
    }
    return col;
  };

  // We set a minimum of 6 items per column so the infinite loop doesn't glitch when there are few items.
  const finalCol1 = buildRandomColumn(items, 6);
  const finalCol2 = buildRandomColumn(items, 6);
  const finalCol3 = buildRandomColumn(items, 6);

  const MarqueeColumn = ({ items, direction }) => {
    // Duplicate items multiple times to ensure smooth infinite scroll
    const duplicatedItems = [...items, ...items, ...items];
    
    return (
      <div className="relative h-full w-full overflow-hidden flex flex-col gap-4 rounded-xl group/col">
        <div 
          className={`flex flex-col gap-4 w-full transition-all duration-300 ${
            direction === 'up' ? 'animate-marquee-up' : 'animate-marquee-down'
          } group-hover/marquee:!play-state-paused`}
          style={{ animationPlayState: 'running' }}
          onMouseEnter={(e) => {
            const el = direction === 'up' ? e.currentTarget : e.currentTarget;
            el.style.animationPlayState = 'paused';
          }}
          onMouseLeave={(e) => {
            const el = direction === 'up' ? e.currentTarget : e.currentTarget;
            el.style.animationPlayState = 'running';
          }}
        >
          {duplicatedItems.map((item, idx) => {
            const imgEl = (
              <img 
                src={item.image} 
                alt="Collectible" 
                className="w-full aspect-[4/5] object-cover rounded-xl shadow-md hover:opacity-90 transition-opacity"
              />
            );

            return item.link ? (
              <Link key={idx} to={item.link} className="block w-full">
                {imgEl}
              </Link>
            ) : (
              <div key={idx} className="block w-full">
                {imgEl}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="relative bg-[#1A1110] text-white overflow-hidden rounded-xl lg:rounded-xl max-w-6xl mx-4 lg:mx-auto my-8">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-900/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-start justify-center py-8 sm:py-12 pl-4 sm:pl-8 lg:pl-16 pr-2 lg:pr-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="text-2xl sm:text-4xl lg:text-6xl font-semibold leading-[1.1] mb-3 sm:mb-6 whitespace-pre-line tracking-tight text-white/90"
            >
              {mainTitle}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs sm:text-lg text-gray-400 mb-6 sm:mb-10 max-w-lg leading-relaxed"
            >
              {subtitle}
            </motion.p>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Link 
                to={ctaLink} 
                className="inline-flex items-center justify-center bg-white text-black px-5 py-2.5 sm:px-8 sm:py-4 rounded-full text-xs sm:text-base font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300"
              >
                {ctaLabel}
                <ArrowRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </motion.div>

          </div>

          {/* Right Content - Marquee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 h-[350px] sm:h-[450px] lg:h-[550px] group/marquee perspective-1000 relative ml-4 sm:ml-0">
            <div className="absolute inset-x-0 top-0 h-16 sm:h-24 bg-gradient-to-b from-[#1A1110] to-transparent z-20 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-[#1A1110] to-transparent z-20 pointer-events-none"></div>
            <div className="w-full h-full overflow-hidden">
              <MarqueeColumn items={finalCol1} direction="down" />
            </div>
            <div className="hidden sm:block w-full h-full overflow-hidden">
              <MarqueeColumn items={finalCol2} direction="up" />
            </div>
            <div className="hidden sm:block w-full h-full overflow-hidden">
              <MarqueeColumn items={finalCol3} direction="down" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

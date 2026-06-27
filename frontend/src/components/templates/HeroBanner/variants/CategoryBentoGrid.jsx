import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHeroContent } from '@/hooks/useHeroContent';
import useEmblaCarousel from 'embla-carousel-react';

export default function HeroBannerCategoryBentoGrid() {
  const { content, loading } = useHeroContent('CategoryBentoGrid');
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' });

  useEffect(() => {
    if (content?.seoTitle) {
      document.title = content.seoTitle;
    }
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

  const mainTitle = content?.mainTitle || "IT'S YOUR\nFIRST TIME?";
  const subtitle = content?.subtitle || "Explore categories!";
  
  const box1Label = content?.box1Label || "NATURAL NUTS";
  const box1ImagePrompt = content?.box1ImagePrompt || "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80"; 

  const box2Label = content?.box2Label || "DRIED FRUITS";
  const box2ImagePrompt = content?.box2ImagePrompt || "https://images.unsplash.com/photo-1623910271383-021021bc8201?w=600&q=80";

  const box3Label = content?.box3Label || "SUPLEMENTS";
  const box3ImagePrompt = content?.box3ImagePrompt || "https://images.unsplash.com/photo-1594911854619-3ee2f5fbce41?w=600&q=80";

  const box4Label = content?.box4Label || "BARS AND SNACKS";
  const box4ImagePrompt = content?.box4ImagePrompt || "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80";

  const box5Label = content?.box5Label || "DRINKS";
  const box5ImagePrompt = content?.box5ImagePrompt || "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80";

  const getImageUrl = (urlOrPrompt) => {
    if (!urlOrPrompt) return '';
    return urlOrPrompt.startsWith('http') ? urlOrPrompt : `https://source.unsplash.com/900x900/?${encodeURIComponent(urlOrPrompt)}`;
  };

  const getLink = (index) => content?.[`box${index}ImageLink`] || '/';

  const renderLabel = (label) => (
    <span className="bg-black text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full inline-block shadow-sm">
      {label}
    </span>
  );

  return (
    <section className="relative bg-white pt-8 pb-12 sm:pt-12 sm:pb-16" data-testid="home-hero-category-bento">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* MOBILE CAROUSEL */}
        <div className="block lg:hidden overflow-hidden w-full" ref={emblaRef}>
          <div className="flex touch-pan-y items-stretch">
            {/* Box 1 */}
            <div className="flex-[0_0_100%] min-w-0 pr-4">
              <Link to={getLink(1)} className="block w-full aspect-square rounded-xl overflow-hidden relative bg-[#FADADD] p-6 flex flex-col justify-between group">
                <div className="absolute inset-0 z-0">
                  <img src={getImageUrl(box1ImagePrompt)} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" alt={box1Label}/>
                </div>
                <div className="relative z-10 pointer-events-none">
                  <h1 className="text-3xl font-black text-black leading-tight mb-2 whitespace-pre-line uppercase font-sans">
                    {mainTitle}
                  </h1>
                  <p className="text-gray-800 text-base">{subtitle}</p>
                </div>
                <div className="relative z-10 mt-auto self-start">
                  {renderLabel(box1Label)}
                </div>
              </Link>
            </div>
            
            {/* Box 2 & 3 */}
            <div className="flex-[0_0_100%] min-w-0 pr-4">
              <div className="flex flex-col gap-4 h-full aspect-square">
                <Link to={getLink(2)} className="flex-1 rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center">
                  <img src={getImageUrl(box2ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box2Label}/>
                  <div className="relative z-10">{renderLabel(box2Label)}</div>
                </Link>
                <Link to={getLink(3)} className="flex-1 rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center">
                  <img src={getImageUrl(box3ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box3Label}/>
                  <div className="relative z-10">{renderLabel(box3Label)}</div>
                </Link>
              </div>
            </div>

            {/* Box 4 */}
            <div className="flex-[0_0_100%] min-w-0 pr-4">
              <Link to={getLink(4)} className="block w-full aspect-square rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center">
                <img src={getImageUrl(box4ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box4Label}/>
                <div className="relative z-10">{renderLabel(box4Label)}</div>
              </Link>
            </div>

            {/* Box 5 */}
            <div className="flex-[0_0_100%] min-w-0 pr-4">
              <Link to={getLink(5)} className="block w-full aspect-square rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center">
                <img src={getImageUrl(box5ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box5Label}/>
                <div className="relative z-10">{renderLabel(box5Label)}</div>
              </Link>
            </div>
          </div>
        </div>

        {/* DESKTOP GRID */}
        <div className="hidden lg:grid grid-cols-5 gap-4 h-[560px]">
          
          {/* Box 1: Left */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="col-span-2 row-span-2">
            <Link to={getLink(1)} className="block w-full h-full rounded-xl overflow-hidden relative group bg-[#fce4ec] p-10 flex flex-col justify-between shadow-sm">
              <div className="absolute inset-0 z-0">
                <img src={getImageUrl(box1ImagePrompt)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box1Label}/>
              </div>
              <div className="relative z-10 pointer-events-none">
                <h1 className="text-4xl xl:text-5xl font-black text-black leading-[1.1] mb-3 whitespace-pre-line uppercase font-sans tracking-tight">
                  {mainTitle}
                </h1>
                <p className="text-gray-800 text-lg xl:text-xl font-medium">{subtitle}</p>
              </div>
              
              <div className="relative z-10 mt-auto self-start">
                {renderLabel(box1Label)}
              </div>
            </Link>
          </motion.div>

          {/* Box 2, 3, 4: Middle Column */}
          <div className="col-span-2 row-span-2 grid grid-cols-2 grid-rows-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="col-span-1 row-span-1">
              <Link to={getLink(2)} className="block w-full h-full rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center shadow-sm">
                <img src={getImageUrl(box2ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box2Label}/>
                <div className="relative z-10">{renderLabel(box2Label)}</div>
              </Link>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="col-span-1 row-span-1">
              <Link to={getLink(3)} className="block w-full h-full rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center shadow-sm">
                <img src={getImageUrl(box3ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box3Label}/>
                <div className="relative z-10">{renderLabel(box3Label)}</div>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="col-span-2 row-span-1">
              <Link to={getLink(4)} className="block w-full h-full rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center shadow-sm">
                <img src={getImageUrl(box4ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box4Label}/>
                <div className="relative z-10">{renderLabel(box4Label)}</div>
              </Link>
            </motion.div>
          </div>

          {/* Box 5: Right */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="col-span-1 row-span-2">
            <Link to={getLink(5)} className="block w-full h-full rounded-xl overflow-hidden relative group bg-gray-100 flex items-center justify-center shadow-sm">
              <img src={getImageUrl(box5ImagePrompt)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={box5Label}/>
              <div className="relative z-10">{renderLabel(box5Label)}</div>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

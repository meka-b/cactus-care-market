import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHeroContent } from '@/hooks/useHeroContent';
import useEmblaCarousel from 'embla-carousel-react';

export default function HeroBannerBentoGrid() {
  const { content, loading } = useHeroContent('BentoGrid');
  const [emblaRef] = useEmblaCarousel({ loop: true });

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

  const badge = content?.badge || "Ev & Ofis İçin — Bakımı Kolay";
  const mainTitle = content?.mainTitle || "ELEGANT LIVING \n ROOM PLANTS";
  const mainImagePrompt = content?.mainImagePrompt || "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?w=800&q=80";
  const bottomLeftImage1Prompt = content?.bottomLeftImage1Prompt || "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80";
  const bottomLeftImage2Prompt = content?.bottomLeftImage2Prompt || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80";
  const rightTallImagePrompt = content?.rightTallImagePrompt || "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80";

  const getImageUrl = (urlOrPrompt) => {
    if (!urlOrPrompt) return '';
    return urlOrPrompt.startsWith('http') ? urlOrPrompt : `https://source.unsplash.com/900x900/?${encodeURIComponent(urlOrPrompt)}`;
  };

  const renderMainBox = () => (
    <div className="bg-[#F3F4F3] rounded-[24px] p-6 sm:p-12 w-full h-full flex flex-col sm:flex-row relative overflow-hidden group">
      <div className="relative z-10 w-full sm:w-1/2 flex flex-col items-start justify-center">
        <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-3">
          {badge}
        </span>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] text-gray-900 mb-4 font-heading whitespace-pre-line">
          {mainTitle}
        </h1>
        <Link to="/k/ic-mekan-bitkileri" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-900 shadow-sm hover:scale-105 transition-transform">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </Link>
      </div>
      <div className="w-full sm:w-1/2 flex-1 mt-6 sm:mt-0 relative overflow-hidden rounded-xl">
        {content?.mainLink ? (
          <Link to={content.mainLink} className="block w-full h-full absolute inset-0" title={content?.mainAlt || "Ana Görsel"}>
            <img src={getImageUrl(mainImagePrompt)} alt={content?.mainAlt || "Ana Görsel"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </Link>
        ) : (
          <img src={getImageUrl(mainImagePrompt)} alt={content?.mainAlt || "Ana Görsel"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
      </div>
    </div>
  );

  const renderSmallBox1 = () => (
    <div className="bg-[#EBECE8] rounded-[24px] relative overflow-hidden group cursor-pointer w-full h-full">
      {content?.bottomLeftImage1Link ? (
        <Link to={content.bottomLeftImage1Link} className="block w-full h-full absolute inset-0" title={content?.bottomLeftImage1Alt || "Sol Alt Görsel 1"}>
          <img src={getImageUrl(bottomLeftImage1Prompt)} alt={content?.bottomLeftImage1Alt || "Sol Alt Görsel 1"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>
      ) : (
        <img src={getImageUrl(bottomLeftImage1Prompt)} alt={content?.bottomLeftImage1Alt || "Sol Alt Görsel 1"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      )}
    </div>
  );

  const renderSmallBox2 = () => (
    <div className="bg-[#DCE1DB] rounded-[24px] relative overflow-hidden group cursor-pointer w-full h-full">
      {content?.bottomLeftImage2Link ? (
        <Link to={content.bottomLeftImage2Link} className="block w-full h-full absolute inset-0" title={content?.bottomLeftImage2Alt || "Sol Alt Görsel 2"}>
          <img src={getImageUrl(bottomLeftImage2Prompt)} alt={content?.bottomLeftImage2Alt || "Sol Alt Görsel 2"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>
      ) : (
        <img src={getImageUrl(bottomLeftImage2Prompt)} alt={content?.bottomLeftImage2Alt || "Sol Alt Görsel 2"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      )}
    </div>
  );

  const renderTallBox = () => (
    <div className="bg-[#F5F5F5] rounded-[24px] relative overflow-hidden group w-full h-full cursor-pointer">
      {content?.rightTallImageLink ? (
        <Link to={content.rightTallImageLink} className="block w-full h-full absolute inset-0" title={content?.rightTallImageAlt || "Sağ Dikey Görsel"}>
          <img src={getImageUrl(rightTallImagePrompt)} alt={content?.rightTallImageAlt || "Sağ Dikey Görsel"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>
      ) : (
        <img src={getImageUrl(rightTallImagePrompt)} alt={content?.rightTallImageAlt || "Sağ Dikey Görsel"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      )}
    </div>
  );

  return (
    <section className="relative bg-white pt-8 pb-12 sm:pt-12 sm:pb-16" data-testid="home-hero-bento">
      
      {/* MOBILE CAROUSEL */}
      <div className="block lg:hidden overflow-hidden w-full px-4" ref={emblaRef}>
        <div className="flex touch-pan-y items-stretch">
          {/* Slide 1: Main Box */}
          <div className="flex-[0_0_100%] min-w-0 pr-4">
            <div className="w-full aspect-square">
              {renderMainBox()}
            </div>
          </div>
          {/* Slide 2: Two Small Boxes */}
          <div className="flex-[0_0_100%] min-w-0 pr-4">
            <div className="w-full aspect-square flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                {renderSmallBox1()}
              </div>
              <div className="flex-1 min-h-0">
                {renderSmallBox2()}
              </div>
            </div>
          </div>
          {/* Slide 3: Tall Box */}
          <div className="flex-[0_0_100%] min-w-0 pr-4">
            <div className="w-full aspect-square">
              {renderTallBox()}
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP GRID */}
      <div className="hidden lg:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-6 h-[600px]">
          
          {/* Left Column (2/3 width) */}
          <div className="col-span-2 flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1">
              {renderMainBox()}
            </motion.div>

            <div className="grid grid-cols-2 gap-6 h-[240px]">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="h-full">
                {renderSmallBox1()}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full">
                {renderSmallBox2()}
              </motion.div>
            </div>
          </div>

          {/* Right Column (1/3 width) */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="col-span-1 h-full">
            {renderTallBox()}
          </motion.div>

        </div>
      </div>

    </section>
  );
}

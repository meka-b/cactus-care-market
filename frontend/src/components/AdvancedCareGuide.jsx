import React, { memo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { Droplet, Sun, Wind, Move, Shovel, Flower, Scissors, Box, Coffee } from 'lucide-react';

const getSeoQuestion = (id, productName) => {
  const map = {
    how_it_grows: 'nasıl büyür ve gelişir?',
    anatomy: 'anatomisi ve genel özellikleri nelerdir?',
    advice: 'için özel bakım tavsiyeleri nelerdir?',
    size: 'ne kadar büyür ve boylanır?',
    water_me: 'nasıl sulanır, su ihtiyacı nedir?',
    position_me: 'nereye yerleştirilir, güneş ihtiyacı nedir?',
    help_me_flower: 'çiçek açması için ne yapılmalı?',
    share_me: 'nasıl çoğaltılır ve üretilir?',
    repot_me: 'saksı değişimi nasıl ve ne zaman yapılır?',
    feed_me: 'nasıl gübrelenir ve besin ihtiyacı nedir?'
  };
  return `${productName} ${map[id] || 'bakımı nasıl yapılır?'}`;
};

const SECTIONS_LEFT = [
  { id: 'how_it_grows', label: 'NASIL BÜYÜR?', icon: Move },
  { id: 'anatomy', label: 'ANATOMİ', icon: Box },
  { id: 'advice', label: 'TAVSİYE', icon: Wind },
  { id: 'size', label: 'NE KADAR BÜYÜR?', icon: Move },
];

const SECTIONS_RIGHT = [
  { id: 'water_me', label: 'BENİ SULA', icon: Droplet },
  { id: 'position_me', label: 'BENİ YERLEŞTİR', icon: Sun },
  { id: 'help_me_flower', label: 'ÇİÇEK AÇMAMA YARDIM ET', icon: Flower },
  { id: 'share_me', label: 'BENİ ÇOĞALT', icon: Scissors },
  { id: 'repot_me', label: 'SAKSIMI DEĞİŞTİR', icon: Shovel },
  { id: 'feed_me', label: 'BENİ BESLE', icon: Coffee },
];

const Card = memo(({ sec, productName }) => {
  const Icon = sec.icon;
  const hasImage = !!sec.data.image;
  const seoTitle = getSeoQuestion(sec.id, productName || 'Bitki');

  return (
    <div 
      className={`relative w-64 sm:w-72 flex flex-col justify-end flex-shrink-0 rounded-xl p-6 sm:p-8 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group ${!hasImage ? 'bg-white' : ''}`}
    >
      {/* Background Image Container */}
      {hasImage && (
        <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
          <img 
            src={sec.data.image} 
            alt={seoTitle}
            title={`${productName || 'Bitki'} bakım görseli`} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-80"></div>
        </div>
      )}

      {/* Top Left Icon (Only if no image) */}
      {!hasImage && (
        <div className="absolute -top-5 -left-5 w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm transform -rotate-6 border-4 border-white group-hover:scale-110 transition-transform duration-300 z-20">
          <Icon className="w-5 h-5" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-20 mt-auto">
        <h3 className={`font-bold mt-6 mb-2 uppercase text-xs tracking-widest font-heading transition-colors ${hasImage ? 'text-white' : 'text-emerald-700 group-hover:text-emerald-600'}`}>
          <span aria-hidden="true">{sec.label}</span>
          <span className="sr-only">{seoTitle}</span>
        </h3>
        <p className={`text-sm leading-relaxed font-medium line-clamp-5 ${hasImage ? 'text-slate-200' : 'text-slate-600'}`}>
          {sec.data.text}
        </p>
      </div>
    </div>
  );
});

export function AdvancedCareGuide({ product }) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true },
    [AutoScroll({ playOnInit: true, speed: 1.2, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  
  const guide = product?.advanced_guide;

  const allSections = [...SECTIONS_LEFT, ...SECTIONS_RIGHT].map(sec => {
    const data = guide?.sections?.[sec.id];
    if (!data || !data.text) return null;
    return { ...sec, data };
  }).filter(Boolean);

  if (!guide || !guide.enabled) return null;
  if (allSections.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allSections.map(sec => ({
      "@type": "Question",
      "name": getSeoQuestion(sec.id, product?.common_name_tr || product?.scientific_name || 'Bitki'),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": sec.data.text
      }
    }))
  };

  return (
    <section className="w-full my-16 lg:my-24 px-4 sm:px-0" aria-labelledby="advanced-care-heading">
      
      {/* LLM & SEO JSON-LD Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      {/* Bounded Box */}
      <div className="flex flex-col justify-center overflow-hidden py-12 sm:py-16 bg-[#FAFCFB] rounded-xl sm:rounded-xl border border-[hsl(var(--primary))]/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative">
        
        <div className="text-center mb-8 relative z-20 px-4">
          <h2 id="advanced-care-heading" className="text-2xl sm:text-3xl font-bold font-heading text-slate-800 tracking-tight">Bu Türe Özel Bakım Tavsiyelerimiz</h2>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Bitkinizin dilinden anlamak için ihtiyacınız olan her şey</p>
        </div>

        {/* Timeline Line */}
        <div className="absolute top-[60%] left-0 w-full h-px bg-[hsl(var(--primary))]/10 pointer-events-none hidden sm:block"></div>

        {/* Left Fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAFCFB] to-transparent z-10 pointer-events-none rounded-l-xl"></div>
        {/* Right Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAFCFB] to-transparent z-10 pointer-events-none rounded-r-xl"></div>
        
        <div className="overflow-hidden w-full" ref={emblaRef}>
          <div className="flex gap-6 sm:gap-12 pt-8 pb-8 items-stretch cursor-grab active:cursor-grabbing px-6 sm:px-16">
            {allSections.map((sec, index) => (
              <Card key={sec.id} sec={sec} productName={product?.common_name_tr || product?.scientific_name} />
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}

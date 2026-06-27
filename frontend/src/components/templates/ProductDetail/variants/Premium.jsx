import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '@/lib/api';
import { CareBento } from '@/components/CareBento';
import { ProductReviews } from '@/components/ProductReviews';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { ProductCard } from '@/components/ProductCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Minus, Plus, Star, Sun, Droplets, Sparkles, Ruler, PawPrint, Circle, Heart, Leaf, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { BlogRenderer } from '@/components/BlogRenderer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

function CareBadge({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col items-start p-3 sm:p-4 rounded-xl bg-gray-50/80">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
        <Icon className="w-4 h-4 text-gray-400" />
        <span>{label}</span>
      </div>
      <h4 className="text-[13px] sm:text-sm font-medium text-gray-900 leading-tight">{value}</h4>
    </div>
  );
}

export default function ProductDetailPremium({ product, data, slug }) {
  const [qty, setQty] = useState(1);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const mainButtonRef = useRef(null);
  const { add } = useCart();
  const { isIn, toggle } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!mainButtonRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setShowFloatingButton(!entries[0].isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(mainButtonRef.current);

    return () => observer.disconnect();
  }, [product]);

  if (!product) return null;

  const inWishlist = isIn(product.id);
  const images = product.images || [];

  const onAdd = () => {
    add(product, qty);
    toast.success(`${product.common_name_tr} sepete eklendi`);
  };

  const onHeart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.info('Favorilere eklemek için giriş yapın'); navigate('/giris'); return; }
    const r = await toggle(product.id);
    if (r?.action === 'added') toast.success('Favorilere eklendi');
    if (r?.action === 'removed') toast.success('Favorilerden çıkarıldı');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16 pb-32 font-sans bg-white">
      
      {/* 2-Column Layout */}
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 items-start">
        
        {/* Left: Asymmetrical Gallery */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4" data-testid="premium-gallery">
          {images.length === 0 && (
            <div className="col-span-2 aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
              Görsel Yok
            </div>
          )}
          {images.map((img, i) => {
            const isFull = i % 3 === 0;
            return (
              <div key={i} className={`relative rounded-xl overflow-hidden bg-[#F8F8F8] group ${isFull ? 'col-span-2' : 'col-span-1'}`}>
                {i === 0 && (
                  <button 
                    onClick={onHeart} 
                    className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105 z-10"
                  >
                    <Heart className="w-5 h-5 text-gray-900" fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  </button>
                )}
                <img 
                  src={resolveImageUrl(img.main)} 
                  alt={`${product.common_name_tr} ${i+1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover aspect-[4/5] sm:aspect-[3/4] transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105" 
                />
              </div>
            );
          })}
          
          {/* Related Products Slider at the bottom of the Left Panel */}
          {data?.related?.length > 0 && (
            <div className="col-span-2 mt-16 border-t border-gray-100 pt-10">
              <h2 className="text-xl font-medium tracking-tight text-gray-900 mb-6">Benzer Ürünler</h2>
              <Carousel
                opts={{ align: "start", loop: true }}
                className="w-full relative"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {data.related.map((p) => (
                    <CarouselItem key={p.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3">
                      <ProductCard product={p} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {/* Custom position for carousel buttons */}
                <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 border-gray-200 bg-white shadow-sm" />
                <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 border-gray-200 bg-white shadow-sm" />
              </Carousel>
            </div>
          )}
        </div>

        {/* Right: Sticky Purchase Panel */}
        <div className="lg:sticky lg:top-24 flex flex-col" data-testid="premium-purchase-panel">
          <div className="mb-2 text-sm text-gray-500 uppercase tracking-widest">{product.category}</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
            {product.common_name_tr}
          </h1>
          
          <div className="mt-5 flex items-center gap-4">
            <span className="text-2xl font-medium text-gray-900">
              {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
            <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1.5" />
              <span>4.9 <span className="text-gray-400 ml-1">(87 Değerlendirme)</span></span>
            </div>
          </div>
          
          <p className="mt-8 text-[15px] sm:text-base text-gray-600 leading-relaxed border-t border-gray-100 pt-8">
            {product.short_description || "Güzel çiçekler açan, bakımı kolay ve dayanıklı bir bitki türü. Yaşam alanlarınıza doğal bir dokunuş katar."}
          </p>

          {product.species_slug && (
            <Link to={`/tur/${product.species_slug}`} className="mt-6 flex items-center justify-between p-4 bg-emerald-50/80 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-emerald-900">Botanik Ansiklopedi</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">Bu tür hakkında AI destekli detaylı bakım rehberi</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Purchase Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3" ref={mainButtonRef}>
            <div className="flex w-full sm:w-auto items-center border border-gray-200 rounded-xl bg-white shrink-0">
              <button 
                onClick={() => setQty(q => Math.max(1, q-1))} 
                className="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-medium text-gray-900">{qty}</span>
              <button 
                onClick={() => setQty(q => q+1)} 
                className="w-14 h-14 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={(e) => { e.currentTarget.blur(); onAdd(); }} 
              disabled={product.stock <= 0}
              className="flex-1 w-full h-14 bg-black text-white rounded-xl font-medium text-base transition-all hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? 'Sepete Ekle' : 'Tükendi'}
            </button>
          </div>

          {/* Care Requirements (3x2 Grid) */}
          <div className="mt-10 grid grid-cols-3 gap-3">
             <CareBadge icon={Sun} label="Işık" value={product.light_need} />
             <CareBadge icon={Droplets} label="Sulama" value={product.water_need} />
             <CareBadge icon={Sparkles} label="Bakım" value={product.care_level} />
             <CareBadge icon={Ruler} label="Boyut" value={product.size} />
             <CareBadge icon={PawPrint} label="Pet Safe" value={product.pet_safe ? 'Evet' : 'Hayır'} />
             <CareBadge icon={Circle} label="Saksı" value={product.pot_size || '-'} />
          </div>

          {/* Accordion Content */}
          <div className="mt-10 pt-4">
            <Accordion type="single" collapsible defaultValue="desc" className="w-full">
              <AccordionItem value="desc" className="border-gray-100 py-2">
                <AccordionTrigger className="text-base font-medium hover:no-underline text-gray-900">Açıklama</AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4 text-[15px]">
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-[15px]">
                    {(() => {
                      let isJson = false;
                      let parsedDesc = product.description;
                      if (typeof product.description === 'string' && product.description.startsWith('{')) {
                        try {
                          parsedDesc = JSON.parse(product.description);
                          isJson = true;
                        } catch(e) {}
                      }
                      
                      if (isJson) {
                        return <BlogRenderer data={parsedDesc} />;
                      }
                      
                      return <div className="whitespace-pre-line">{product.description}</div>;
                    })()}
                  </div>

                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="care" className="border-gray-100 py-2">
                <AccordionTrigger className="text-base font-medium hover:no-underline text-gray-900">Bakım Rehberi</AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4 text-[15px]">
                   <ul className="space-y-3">
                      {(product.care_tips || []).map((tip, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                      {(!product.care_tips || product.care_tips.length === 0) && (
                        <li>Düzenli sulama ve dolaylı güneş ışığı önerilir.</li>
                      )}
                   </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ship" className="border-gray-100 py-2">
                <AccordionTrigger className="text-base font-medium hover:no-underline text-gray-900">Kargo & İade</AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4 text-[15px]">
                   Siparişiniz 24 saat içinde hazırlanıp kargolanır. Canlı bitki gönderimlerinde bitkinin zarar görmemesi için ekstra korunaklı, iklim koşullarına uygun özel kutular kullanılmaktadır. 14 gün içinde iade talebi oluşturabilirsiniz.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Product Reviews at the bottom of the Right Panel */}
          <div className="mt-16 pt-10">
            <h2 className="text-xl font-medium tracking-tight text-gray-900 mb-8">Müşteri Değerlendirmeleri</h2>
            <ProductReviews slug={slug} />
          </div>
        </div>
      </div>

      {/* Mobile Floating Top Add to Cart */}
      <div
        className={`lg:hidden fixed top-[72px] left-1/2 -translate-x-1/2 z-40 transition-all duration-[250ms] ease-out pointer-events-none ${showFloatingButton ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 invisible'}`}
      >
        <button
          onClick={(e) => { e.currentTarget.blur(); onAdd(); }}
          disabled={product.stock <= 0}
          className="flex items-center gap-2 h-12 px-6 bg-black/90 backdrop-blur-md text-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <span className="font-medium text-[15px] whitespace-nowrap">
            {product.stock > 0 ? 'Sepete Ekle' : 'Tükendi'}
          </span>
        </button>
      </div>
    </div>
  );
}

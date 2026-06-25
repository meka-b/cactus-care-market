import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Leaf } from 'lucide-react';
import { resolveImageUrl } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import useEmblaCarousel from 'embla-carousel-react';

export default function ProductCardMetro({ product, imageRatio = '1:1' }) {
  const { add } = useCart();
  const { isIn, toggle } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const images = product.images?.length ? product.images : [{ main: null }];
  const inWishlist = isIn(product.id);
  const isOutOfStock = product.stock === 0 || product.in_stock === false;

  const onHeart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.info('Favorilere eklemek için giriş yapın'); navigate('/giris'); return; }
    const r = await toggle(product.id);
    if (r?.action === 'added') toast.success('Favorilere eklendi');
    if (r?.action === 'removed') toast.success('Favorilerden çıkarıldı');
  };

  const scrollTo = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  return (
    <div className="flex flex-col h-full bg-white rounded-[28px] p-3 shadow-[0_2px_12px_rgb(0,0,0,0.04)] font-sans group border border-gray-100 relative">
      
      {/* Image Container with Embla */}
      {/* Image Container with Embla */}
      <div className="relative w-full rounded-[20px] overflow-hidden bg-[#F4F5F7] mb-5 group-hover:bg-[#EBECEE] transition-colors duration-300" style={{ aspectRatio: { '1:1': '1 / 1', '3:4': '3 / 4', '4:5': '4 / 5' }[imageRatio] || '1 / 1' }}>
        
        {/* Top-left Brand Logo / Icon */}
        <div className="absolute top-4 left-4 z-10">
           <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center justify-center">
             <Leaf className="w-4 h-4 text-gray-800" />
           </div>
        </div>

        {/* Embla Viewport */}
        <div className="overflow-hidden h-full w-full" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {images.map((img, index) => {
              const src = img.main || img.thumb;
              return (
                <div className="relative flex-[0_0_100%] min-w-0 h-full" key={index}>
                  <Link to={`/u/${product.slug}`} className="block w-full h-full">
                    {src ? (
                      <img 
                        src={resolveImageUrl(src)} 
                        alt={`${product.common_name_tr} - Görsel ${index + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Görsel Yok
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => scrollTo(e, index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === selectedIndex ? 'bg-[#10B981]' : 'bg-gray-300/80 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none">
            <span className="bg-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              Tükendi
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-1">
        
        {/* Top Content Row: Badge & Heart */}
        <div className="flex justify-between items-center mb-3">
          <span className="bg-emerald-50 text-[#10B981] text-xs font-semibold px-3 py-1 rounded-full">
            Popüler
          </span>
          <button
             onClick={onHeart}
             className={`p-1 transition-colors ${
               inWishlist ? 'text-red-500' : 'text-gray-300 hover:text-red-500'
             }`}
           >
             <Heart className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={inWishlist ? 0 : 2} />
           </button>
        </div>
        
        <Link to={`/u/${product.slug}`} className="block mb-4 flex-1">
          <h3 className="text-[17px] font-bold text-[#1A1A1A] leading-snug line-clamp-2">
            {product.common_name_tr}
          </h3>
        </Link>
        
        {/* Bottom Row: Price & Button */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-[12px] text-gray-400 font-medium mb-0.5">Fiyat</p>
            <p className="text-[18px] text-[#10B981] font-bold">
              {product.price} ₺
            </p>
          </div>
          
          <button 
            onClick={() => {
              if(isOutOfStock) return;
              add({ ...product, quantity: 1 });
              toast.success('Sepete eklendi');
            }}
            disabled={isOutOfStock}
            className="py-2.5 px-6 rounded-full bg-[#222222] text-white text-[14px] font-semibold hover:bg-black active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
          >
            Sepete Ekle
          </button>
        </div>
        
      </div>
    </div>
  );
}

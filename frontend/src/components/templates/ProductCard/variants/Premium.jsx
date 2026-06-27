import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { resolveImageUrl } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function ProductCardPremium({ product, imageRatio = '4:5' }) {
  const { add } = useCart();
  const { isIn, toggle } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const img = product.images?.[0]?.thumb || product.images?.[0]?.main;
  const inWishlist = isIn(product.id);
  const isOutOfStock = product.stock === 0 || product.in_stock === false;

  const onHeart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.info('Favorilere eklemek için giriş yapın'); navigate('/giris'); return; }
    const r = await toggle(product.id);
    if (r?.action === 'added') toast.success('Favorilere eklendi');
    if (r?.action === 'removed') toast.success('Favorilerden çıkarıldı');
  };

  const onAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock) return;
    add(product, 1);
    toast.success(`${product.common_name_tr} sepete eklendi`);
  };

  const ratioMap = { '1:1': '1 / 1', '3:4': '3 / 4', '4:5': '4 / 5' };
  const currentRatio = ratioMap[imageRatio] || '4 / 5';

  return (
    <div className="group relative flex flex-col h-full bg-transparent font-sans">
      
      {/* Image Container */}
      <Link 
        to={`/u/${product.slug}`} 
        className="block relative w-full rounded-xl overflow-hidden bg-[#F8F8F8] mb-4 transition-[aspect-ratio] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] aspect-[var(--base-ratio)] group-hover:aspect-square" 
        style={{ '--base-ratio': currentRatio }}
      >
        {img ? (
          <img 
            src={resolveImageUrl(img)} 
            alt={product.common_name_tr} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" 
            loading="lazy" 
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Görsel Yok
          </div>
        )}

        {/* Hover Wishlist Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={onHeart}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform hover:scale-105"
            aria-label={inWishlist ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart className="w-5 h-5 text-gray-900" fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Out of stock badge - minimal style */}
        {isOutOfStock && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-900">
            Tükendi
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="flex flex-col relative">
        <Link to={`/u/${product.slug}`} className="block">
          <h3 className="text-[15px] font-medium text-gray-900 leading-snug">
            {product.common_name_tr} —
          </h3>
          <div className="text-[16px] font-normal text-gray-900 mt-0.5">
            {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </div>
        </Link>

        {/* Add to Cart Button (Hover Reveal) */}
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <div className="overflow-hidden">
            <div className="pt-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
              <button
                onClick={onAddToCart}
                disabled={isOutOfStock}
                className="w-full bg-black text-white py-3 rounded-xl font-medium text-sm transition-colors hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50"
              >
                {isOutOfStock ? 'Tükendi' : 'Sepete Ekle'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

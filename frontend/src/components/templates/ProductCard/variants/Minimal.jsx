import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { resolveImageUrl } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function ProductCardMinimal({ product, imageRatio = '1:1' }) {
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

  return (
    <div className="group relative flex flex-col h-full bg-white transition-all duration-300 font-sans">
      
      {/* Aspect Ratio Container for Image */}
      {/* Aspect Ratio Container for Image */}
      <Link to={`/u/${product.slug}`} className="block relative w-full rounded-xl overflow-hidden bg-[#F3F4F6] mb-4" style={{ aspectRatio: { '1:1': '1 / 1', '3:4': '3 / 4', '4:5': '4 / 5' }[imageRatio] || '1 / 1' }}>
        {img ? (
          <img 
            src={resolveImageUrl(img)} 
            alt={product.common_name_tr} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
            loading="lazy" 
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Görsel Yok
          </div>
        )}

        {/* Floating Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={onHeart}
            className={`w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center transition-colors ${
              inWishlist ? 'text-rose-500' : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>
        
        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
            <span className="bg-black text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl">
              Tükendi
            </span>
          </div>
        )}</Link>

      {/* Content */}
      <div className="flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 mb-2">
          <Link to={`/u/${product.slug}`} className="block flex-1">
            <h3 className="text-[15px] font-medium text-gray-900 leading-snug line-clamp-2 hover:underline decoration-1 underline-offset-2">
              {product.common_name_tr}
            </h3>
          </Link>
          <div className="text-right whitespace-nowrap">
            <p className="text-[15px] font-semibold text-gray-900">
              {product.price} ₺
            </p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-1 italic mb-4">
          {product.scientific_name || 'Bilinmiyor'}
        </p>

        <div className="mt-auto">
          <button 
            onClick={() => {
              if(isOutOfStock) return;
              add({ ...product, quantity: 1 });
              toast.success('Sepete eklendi');
            }}
            disabled={isOutOfStock}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Sepete Ekle
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sun, Droplets, Sparkles, PawPrint, Heart, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { resolveImageUrl } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ProductCardDefault({ product, imageRatio = '1:1' }) {
  const { add } = useCart();
  const { isIn, toggle } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const img = product.images?.[0]?.thumb || product.images?.[0]?.main;
  const inWishlist = isIn(product.id);

  const onHeart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.info('Favorilere eklemek için giriş yapın'); navigate('/giris'); return; }
    const r = await toggle(product.id);
    if (r?.action === 'added') toast.success('Favorilere eklendi');
    if (r?.action === 'removed') toast.success('Favorilerden çıkarıldı');
  };
  const badges = [
    <Badge key="light" variant="outline" className="bg-[hsl(var(--secondary))] text-primary border-[hsl(var(--border))] text-[10px] py-0.5 whitespace-nowrap"><Sun className="w-3 h-3 mr-1" />{product.light_need}</Badge>,
    <Badge key="water" variant="outline" className="bg-[hsl(var(--secondary))] text-primary border-[hsl(var(--border))] text-[10px] py-0.5 whitespace-nowrap"><Droplets className="w-3 h-3 mr-1" />{product.water_need}</Badge>,
    product.care_level ? <Badge key="care" variant="outline" className="bg-[hsl(var(--secondary))] text-primary border-[hsl(var(--border))] text-[10px] py-0.5 whitespace-nowrap"><Sparkles className="w-3 h-3 mr-1" />{product.care_level}</Badge> : null,
    product.pot_size ? <Badge key="pot" variant="outline" className="bg-[hsl(var(--secondary))] text-primary border-[hsl(var(--border))] text-[10px] py-0.5 whitespace-nowrap">⌀ {product.pot_size}</Badge> : null,
  ].filter(Boolean).slice(0, 3);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} className="h-full">
      <Card className="overflow-hidden bg-white rounded-xl border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow group relative flex flex-col h-full" data-testid={`product-card-${product.slug}`}>
        <button
          type="button"
          onClick={onHeart}
          className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full grid place-items-center backdrop-blur-sm transition-all ${inWishlist ? 'bg-red-50/95 text-red-500' : 'bg-white/90 text-foreground hover:text-red-500'}`}
          data-testid={`product-wishlist-${product.slug}`}
          aria-label={inWishlist ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
        <Link to={`/u/${product.slug}`} className="block shrink-0">
          <div className="bg-[#F7FBF8] overflow-hidden relative" style={{ aspectRatio: { '1:1': '1 / 1', '3:4': '3 / 4', '4:5': '4 / 5' }[imageRatio] || '1 / 1' }}>
            {img ? (
              <img src={resolveImageUrl(img)} alt={product.images?.[0]?.alt || product.common_name_tr} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 shimmer" />
            )}
          </div>
        </Link>
        <div className="p-4 flex flex-col flex-1">
          <Link to={`/u/${product.slug}`} className="block">
            <h3 className="font-medium text-foreground line-clamp-1 font-heading min-h-[24px]" data-testid={`product-card-title-${product.slug}`}>{product.common_name_tr}</h3>
            <p className="text-xs italic text-muted-foreground mt-0.5 line-clamp-1 min-h-[16px]">{product.scientific_name}</p>
          </Link>
          <div className="flex flex-wrap gap-1.5 mt-2 h-[24px] overflow-hidden items-center">
            {badges}
          </div>
          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <div className="text-lg font-semibold text-foreground" data-testid={`product-card-price-${product.slug}`}>₺{(product.price || 0).toFixed(2)}</div>
            <Button size="sm" onClick={(e) => { e.preventDefault(); add(product); }} className="bg-primary text-white hover:bg-emerald-600 sm:px-3 px-2.5" data-testid={`product-card-add-${product.slug}`} aria-label="Sepete ekle">
              <ShoppingCart className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Sepete</span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

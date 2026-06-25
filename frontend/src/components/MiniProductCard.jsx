import React from 'react';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '@/lib/api';
import { Sun, Droplets } from 'lucide-react';

/* Compact product card for use inside blog posts or sidebars. variant='row' is more compact. */
export function MiniProductCard({ product, variant = 'card' }) {
  const img = product.images?.[0]?.thumb || product.images?.[0]?.main;
  if (variant === 'row') {
    return (
      <Link to={`/u/${product.slug}`} className="flex gap-2 group" data-testid={`mini-product-${product.slug}`}>
        {img && <img src={resolveImageUrl(img)} alt={product.common_name_tr} className="w-14 h-14 object-cover rounded-xl" />}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium line-clamp-1 group-hover:text-primary">{product.common_name_tr}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{product.scientific_name}</div>
          <div className="text-sm font-semibold text-primary mt-0.5">₺{(product.price || 0).toFixed(2)}</div>
        </div>
      </Link>
    );
  }
  return (
    <Link to={`/u/${product.slug}`} className="block group" data-testid={`mini-product-${product.slug}`}>
      <div className="flex items-center gap-3 bg-[#F7FBF8] border border-[hsl(var(--border))] rounded-xl p-3 hover:border-primary/40 transition-colors">
        {img && <img src={resolveImageUrl(img)} alt={product.common_name_tr} className="w-20 h-20 object-cover rounded-xl" />}
        <div className="flex-1 min-w-0">
          <div className="font-medium font-heading group-hover:text-primary line-clamp-1 min-h-[24px]">{product.common_name_tr}</div>
          <div className="text-xs italic text-muted-foreground line-clamp-1 min-h-[16px]">{product.scientific_name}</div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5"><Sun className="w-3 h-3" />{product.light_need}</span>
            <span className="inline-flex items-center gap-0.5"><Droplets className="w-3 h-3" />{product.water_need}</span>
          </div>
          <div className="text-sm font-semibold text-primary mt-1">₺{(product.price || 0).toFixed(2)}</div>
        </div>
      </div>
    </Link>
  );
}

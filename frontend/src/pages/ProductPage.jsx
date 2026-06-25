import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, resolveImageUrl } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { Card } from '@/components/ui/card';
import { DynamicComponent } from '@/components/templates/DynamicComponent';
import { toast } from 'sonner';

export default function ProductPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/by-slug/${slug}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  const product = data?.product;
  useSEO(product ? {
    title: product.meta_title || `${product.common_name_tr} - Yeşil Dükkan`,
    description: product.meta_description || product.short_description,
    canonical: window.location.origin + `/u/${slug}`,
    ogImage: product.images?.[0]?.main ? resolveImageUrl(product.images[0].main) : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.common_name_tr,
      description: product.short_description,
      image: product.images?.map(i => resolveImageUrl(i.main)) || [],
      sku: product.id,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TRY',
        price: product.price,
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
  } : { title: 'Ürün - Yeşil Dükkan' });

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10"><div className="shimmer h-96 rounded-xl" /></div>;
  if (!product) return <div className="max-w-6xl mx-auto px-4 py-10"><Card className="p-10 text-center"><p>Ürün bulunamadı.</p></Card></div>;

  return (
    <DynamicComponent name="ProductDetail" data={data} product={product} slug={slug} />
  );
}

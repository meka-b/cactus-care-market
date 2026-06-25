import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { Card } from '@/components/ui/card';
import { Leaf } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useSEO({ title: `${q} - Arama - Yeşil Dükkan`, description: `${q} arama sonuçları` });

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.get('/products', { params: { search: q, limit: 24 } })
      .then(r => setItems(r.data.items))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold font-heading">"{q}" için arama sonuçları</h1>
      <p className="text-muted-foreground mt-1">{items.length} ürün bulundu</p>
      {loading ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] shimmer rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-10 mt-6 text-center"><Leaf className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p>Sonuç bulunamadı.</p></Card>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">{items.map(p => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}

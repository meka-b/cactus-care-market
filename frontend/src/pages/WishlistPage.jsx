import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { ProductCard } from '@/components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSEO } from '@/lib/seo';

export default function WishlistPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useSEO({ title: 'Favorilerim - Yeşil Dükkan' });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get('/wishlist').then(r => setProducts(r.data.products || [])).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="max-w-md mx-auto p-10 text-center">
      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p className="mb-4">Favorileri kullanmak için giriş yapın.</p>
      <Link to="/giris"><Button>Giriş Yap</Button></Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="wishlist-page">
      <h1 className="text-3xl font-semibold font-heading mb-2">Favorilerim</h1>
      <p className="text-muted-foreground mb-6">{products.length} ürün</p>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] shimmer rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <Card className="p-10 text-center bg-white">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Henüz favori ürününüz yok.</p>
          <Link to="/"><Button className="bg-primary text-white hover:bg-emerald-600">Alışverişe Başla</Button></Link>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

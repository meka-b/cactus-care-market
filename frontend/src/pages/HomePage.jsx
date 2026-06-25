import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/ProductCard';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryList } from '@/components/CategoryList';
import { SpeciesCollection } from '@/components/SpeciesCollection';
import { motion } from 'framer-motion';
import { Sun, Droplets, Sparkles, PawPrint, Leaf, ArrowRight, Ruler, TreePine, Flower2, Sprout } from 'lucide-react';

const CATEGORY_TILES = [
  { slug: 'kaktusler', label: 'Kaktüsler', icon: TreePine },
  { slug: 'sukulentler', label: 'Sukulentler', icon: Sprout },
  { slug: 'ic-mekan-bitkileri', label: 'Salon Bitkileri', icon: Leaf },
  { slug: 'mini-bitkiler', label: 'Mini Bitkiler', icon: Ruler },
  { slug: 'pet-friendly-bitkiler', label: 'Pet Friendly', icon: PawPrint },
  { slug: 'az-sulanan-bitkiler', label: 'Az Sulanan', icon: Droplets },
  { slug: 'golge-bitkileri', label: 'Düşük Işık', icon: Sun },
  { slug: 'kolay-bakim-bitkileri', label: 'Kolay Bakım', icon: Sparkles },
  { slug: 'cicekler', label: 'Çiçekler', icon: Flower2 },
];

const SEO_STRIP = [
  { slug: 'kolay-bakim-bitkileri', label: 'Kolay Bakım Bitkileri', desc: 'Yeni başlayanlar için' },
  { slug: 'az-sulanan-bitkiler', label: 'Az Sulanan Bitkiler', desc: 'Kurakçıl çeşitler' },
  { slug: 'pet-friendly-bitkiler', label: 'Pet Friendly', desc: 'Evcil dostu' },
  { slug: 'mini-bitkiler', label: 'Mini Bitkiler', desc: '0-20 cm' },
  { slug: 'tam-gunes-seven-bitkiler', label: 'Bol Güneş Seven', desc: 'Pencere yanı' },
  { slug: 'golge-bitkileri', label: 'Gölge Bitkileri', desc: 'Düşük ışık' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Yeşil Dükkan - Kaktüs ve Salon Bitkileri',
    description: 'AI destekli akıllı bitki keşif platformu. Binlerce kaktüs, sukulent ve salon bitkisi seçeneklerini keşfet.',
    canonical: window.location.origin + '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Yeşil Dükkan',
      url: window.location.origin,
    },
  });

  useEffect(() => {
    api.get('/products/featured', { params: { limit: 8 } })
      .then(r => setFeatured(r.data.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <HeroBanner />

      {/* Category List */}
      <CategoryList categories={CATEGORY_TILES} />

      {/* Featured */}
      <section className="py-12 sm:py-16 bg-[#F7FBF8]" data-testid="home-featured-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold font-heading">Öne Çıkan Ürünler</h2>
              <p className="text-muted-foreground mt-1">En sevilen bitki seçkileri</p>
            </div>
            <Link to="/k/kaktusler" className="text-primary text-sm font-medium hidden sm:flex items-center gap-1 hover:underline">Tümünü Gör <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] shimmer rounded-xl" />)}
            </div>
          ) : featured.length === 0 ? (
            <Card className="p-8 text-center bg-white">
              <Leaf className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Henüz ürün eklenmemiş. Admin paneline gidip AI ile ilk ürünü ekleyin.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Species Collection */}
      <SpeciesCollection />
    </div>
  );
}

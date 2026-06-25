import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function CollectionPage() {
  const { species } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    setLoading(true);
    const params = { page: 1, limit: 24, sort, search: species };
    api.get('/products', { params })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [species, sort]);

  useSEO({
    title: `${species} Koleksiyonu - Yeşil Dükkan`,
    description: `${species} cinsine ait en özel koleksiyonluk kaktüs ve sukulentler.`,
    canonical: window.location.origin + `/koleksiyon/${species}`,
  });

  const breadcrumbItems = [
    { label: 'Koleksiyon', href: '/koleksiyon' },
    { label: species, href: `/koleksiyon/${species}` }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="collection-page">
      <div className="mb-6">
        <SiteBreadcrumb items={breadcrumbItems} />
        <h1 className="text-2xl sm:text-3xl font-semibold font-heading mt-4">{species} Koleksiyonu</h1>
        <p className="text-muted-foreground mt-2">{species} cinsine ait özel bitkileri keşfedin.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Left Column: Content */}
        <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="text-sm text-muted-foreground">{data?.total ?? 0} ürün</div>
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44 h-9 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="newest">En Yeniler</SelectItem>
                <SelectItem value="price_asc">Fiyat: Düşükten</SelectItem>
                <SelectItem value="price_desc">Fiyat: Yüksekten</SelectItem>
                <SelectItem value="name">İsme Göre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] shimmer rounded-xl" />)}
          </div>
        ) : !data || data.items.length === 0 ? (
          <Card className="p-10 text-center bg-white">
            <Leaf className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Bu koleksiyonda henüz ürün bulunmuyor.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-6">
          <Card className="p-6 bg-emerald-50/50 border-emerald-100 shadow-sm rounded-2xl">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Cins Rehberi
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {species} cinsinin özelliklerini ve nasıl bakılması gerektiğini uzman rehberimizde keşfedin.
            </p>
            <Link to={`/cins/${species.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
              Ansiklopediye Git <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </Card>
          
          <Card className="p-6 bg-slate-50 border-slate-100 shadow-sm rounded-2xl">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-slate-500 mb-3">SEO Linkleme</h3>
            <div className="flex flex-col gap-2">
              <Link to="/bilgi" className="text-sm text-slate-700 hover:text-emerald-600">Bitki Ansiklopedisi</Link>
              <Link to="/hastaliklar" className="text-sm text-slate-700 hover:text-emerald-600">Hastalık Rehberi</Link>
              <Link to="/blog" className="text-sm text-slate-700 hover:text-emerald-600">Bakım Blogları</Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

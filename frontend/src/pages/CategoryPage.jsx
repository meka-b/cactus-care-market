import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { ProductCard } from '@/components/ProductCard';
import { ShopHeader } from '@/components/ShopHeader';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Leaf } from 'lucide-react';
import { Card } from '@/components/ui/card';

function FilterPanel({ tax, onChange, current }) {
  const set = (k, v) => onChange({ ...current, [k]: v });
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bakım Zorluğu</div>
        <div className="space-y-1.5">
          {tax.care_levels?.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={current.care === c} onCheckedChange={() => set('care', current.care === c ? '' : c)} />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Işık</div>
        <div className="space-y-1.5">
          {tax.light_needs?.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={current.light === c} onCheckedChange={() => set('light', current.light === c ? '' : c)} />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Sulama</div>
        <div className="space-y-1.5">
          {tax.water_needs?.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={current.water === c} onCheckedChange={() => set('water', current.water === c ? '' : c)} />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Boyut</div>
        <div className="space-y-1.5">
          {tax.sizes?.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={current.size === c} onCheckedChange={() => set('size', current.size === c ? '' : c)} />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={current.pet_safe === 'true'} onCheckedChange={() => set('pet_safe', current.pet_safe === 'true' ? '' : 'true')} />
          <span className="text-sm font-medium">Pet Friendly</span>
        </label>
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={current.in_stock === 'true'} onCheckedChange={() => set('in_stock', current.in_stock === 'true' ? '' : 'true')} data-testid="filter-in-stock-checkbox" />
          <span className="text-sm font-medium">Sadece Stoktakiler</span>
        </label>
      </div>
      <Button variant="outline" onClick={() => onChange({})} className="w-full" data-testid="filters-clear-button">Filtreleri Sıfırla</Button>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tax, setTax] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('newest');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.get('/taxonomy').then(r => setTax(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page: 1, limit: 24, sort, ...filters };
    api.get(`/landing/${slug}`, { params })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, sort, JSON.stringify(filters)]);

  useSEO(data ? {
    title: data.title,
    description: data.description,
    canonical: window.location.origin + `/k/${slug}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: data.h1,
      description: data.description,
      url: window.location.origin + `/k/${slug}`,
    },
  } : { title: 'Kategori - Yeşil Dükkan' });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="category-page">
      <ShopHeader slug={slug} data={data} />

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <Card className="p-5 bg-white sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto" data-testid="category-sticky-filters">
            <h3 className="font-semibold mb-4 font-heading">Filtreler</h3>
            <FilterPanel tax={tax} current={filters} onChange={setFilters} />
          </Card>
        </aside>

        <div>
          {/* Sort + mobile filter */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="text-sm text-muted-foreground" data-testid="category-total">{data?.total ?? 0} ürün</div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden" data-testid="category-filters-open-button"><Filter className="w-4 h-4 mr-1" />Filtrele</Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-white overflow-y-auto">
                  <SheetHeader><SheetTitle className="text-left">Filtreler</SheetTitle></SheetHeader>
                  <div className="mt-4"><FilterPanel tax={tax} current={filters} onChange={setFilters} /></div>
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-44 h-9 rounded-xl" data-testid="category-sort"><SelectValue /></SelectTrigger>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] shimmer rounded-xl" />)}
            </div>
          ) : !data || data.items.length === 0 ? (
            <Card className="p-10 text-center bg-white">
              <Leaf className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Bu filtrelerle eşleşen ürün bulunamadı.</p>
              <Button variant="outline" className="mt-4" onClick={() => setFilters({})}>Filtreleri Sıfırla</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="category-product-grid">
              {data.items.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

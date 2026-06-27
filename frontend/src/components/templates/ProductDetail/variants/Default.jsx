import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { ProductCard } from '@/components/ProductCard';
import { CareBento } from '@/components/CareBento';
import { ProductReviews } from '@/components/ProductReviews';
import { ProductGallery } from '@/components/ProductGallery';
import { MobileTabsBar } from '@/components/MobileTabsBar';
import { BundleModule } from '@/components/BundleModule';
import { AdvancedCareGuide } from '@/components/AdvancedCareGuide';
import { BlogRenderer } from '@/components/BlogRenderer';
import { useCart } from '@/lib/cart';
import { Minus, Plus, ShoppingCart, Truck, ShieldCheck, ChevronRight, RefreshCcw, Leaf } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailDefault({ product, data, slug }) {
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const mainButtonRef = useRef(null);
  const { add } = useCart();

  useEffect(() => {
    if (!mainButtonRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If main button is NOT intersecting (visible), show the floating button
        setShowFloatingButton(!entries[0].isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(mainButtonRef.current);

    return () => observer.disconnect();
  }, [product]);

  if (!product) return null;

  const onAdd = () => {
    add(product, qty);
    toast.success(`${product.common_name_tr} sepete eklendi`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-10" data-testid="product-page">
      <SiteBreadcrumb items={[
        { label: product.category, href: `/k/${product.tags?.[0] || 'kaktusler'}` },
        ...(product.scientific_species ? [
          { label: 'Koleksiyon', href: '/koleksiyon' },
          { label: product.scientific_species, href: `/koleksiyon/${product.scientific_species}` }
        ] : []),
        { label: product.common_name_tr }
      ]} />

      <div className="mt-6 grid lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
        {/* Gallery */}
        <div data-testid="product-gallery">
          <ProductGallery images={product.images || []} productName={product.common_name_tr} />
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-20 self-start" data-testid="product-info-sticky">
          <p className="text-xs italic text-muted-foreground">{product.scientific_name}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold font-heading" data-testid="product-title">{product.common_name_tr}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="bg-[hsl(var(--secondary))] text-primary border-[hsl(var(--border))]">{product.category}</Badge>
            <Badge variant="outline" className="bg-[hsl(var(--secondary))] text-primary border-[hsl(var(--border))]">{product.care_level}</Badge>
            {product.pet_safe && <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Pet Friendly</Badge>}
          </div>
          <p className="mt-4 text-muted-foreground">{product.short_description}</p>
          {product.species_slug && (
            <Link to={`/tur/${product.species_slug}`} className="mt-4 flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Botanik Ansiklopedi</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">AI destekli bakım rehberi ve bilimsel özellikler</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          <div className="mt-6 flex items-baseline gap-3">
            <div className="text-4xl font-semibold text-foreground" data-testid="product-price">₺{(product.price || 0).toFixed(2)}</div>
            {product.stock > 0 ? <Badge className="bg-green-50 text-green-700 border border-green-200">Stokta</Badge> : <Badge variant="outline">Tükendi</Badge>}
          </div>
          <div className="mt-5 flex items-center gap-3" ref={mainButtonRef}>
            <div className="inline-flex items-center border border-[hsl(var(--border))] rounded-xl">
              <Button size="icon" variant="ghost" onClick={() => setQty(q => Math.max(1, q-1))} data-testid="product-qty-minus"><Minus className="w-4 h-4" /></Button>
              <span className="w-10 text-center" data-testid="product-qty">{qty}</span>
              <Button size="icon" variant="ghost" onClick={() => setQty(q => q+1)} data-testid="product-qty-plus"><Plus className="w-4 h-4" /></Button>
            </div>
            <Button size="lg" onClick={onAdd} disabled={product.stock <= 0} className="flex-1 bg-primary text-white hover:bg-emerald-600 h-11" data-testid="product-add-to-cart-button"><ShoppingCart className="w-4 h-4 mr-2" />Sepete Ekle</Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Truck className="w-4 h-4 text-primary" />500 TL üstü ücretsiz kargo</div>
            <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="w-4 h-4 text-primary" />Güvenli ödeme</div>
          </div>

          <div className="mt-6" data-testid="bundle-module-wrapper">
            <BundleModule productId={product.id} />
          </div>
        </div>
      </div>

      {(!product.advanced_guide || !product.advanced_guide.enabled) && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold font-heading mb-3">Bakım Gereksinimleri</h2>
          <CareBento product={product} />
        </section>
      )}

      <AdvancedCareGuide product={product} />

      <div className="w-full my-16 lg:my-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="product-detail-tabs">
          
          <div className="flex justify-center mb-8 px-4 lg:px-0">
            {/* Desktop Tabs */}
            <TabsList className="hidden sm:inline-flex h-auto p-2 bg-[#FAFCFB] border border-[hsl(var(--primary))]/10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <TabsTrigger value="desc" className="rounded-full px-8 py-3.5 text-sm font-bold font-heading tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all duration-300">Açıklama</TabsTrigger>
              <TabsTrigger value="care" className="rounded-full px-8 py-3.5 text-sm font-bold font-heading tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all duration-300">Bakım Rehberi</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-full px-8 py-3.5 text-sm font-bold font-heading tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all duration-300" data-testid="tab-reviews">İncelemeler</TabsTrigger>
              <TabsTrigger value="ship" className="rounded-full px-8 py-3.5 text-sm font-bold font-heading tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all duration-300">Kargo & İade</TabsTrigger>
            </TabsList>

            {/* Mobile Tabs */}
            <div className="sm:hidden w-full">
              <MobileTabsBar
                tabs={[
                  { value: 'desc', label: 'Açıklama', testId: 'mobile-tab-desc' },
                  { value: 'care', label: 'Bakım', testId: 'mobile-tab-care' },
                  { value: 'reviews', label: 'İnceleme', testId: 'mobile-tab-reviews' },
                  { value: 'ship', label: 'Kargo', testId: 'mobile-tab-ship' },
                ]}
                active={activeTab}
                onSelect={setActiveTab}
              />
            </div>
          </div>

          <div className="bg-[#FAFCFB] sm:rounded-[3rem] border-y sm:border border-[hsl(var(--primary))]/10 sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-6 sm:p-12 lg:p-16 relative overflow-hidden min-h-[400px]">
            <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none hidden sm:block"></div>
            
            <TabsContent value="desc" className="mt-0 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {product.description && (
                <div className="max-w-4xl mx-auto">
                  {(() => {
                    let isJson = false;
                    let parsedDesc = product.description;
                    if (typeof product.description === 'string' && product.description.startsWith('{')) {
                      try {
                        parsedDesc = JSON.parse(product.description);
                        isJson = true;
                      } catch(e) {}
                    }
                    
                    if (isJson) {
                      return <BlogRenderer data={parsedDesc} />;
                    }
                    
                    return <div className="prose prose-slate sm:prose-lg text-slate-600 leading-relaxed font-medium whitespace-pre-line">{product.description}</div>;
                  })()}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="care" className="mt-0 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold font-heading text-emerald-800 mb-6">Bakım İpuçları</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(product.care_tips || []).map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 font-medium leading-relaxed">{tip}</span>
                    </li>
                  ))}
                  {(!product.care_tips || product.care_tips.length === 0) && (
                    <li className="text-slate-500">Henüz bakım ipucu eklenmemiş.</li>
                  )}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="max-w-5xl mx-auto">
                 <ProductReviews slug={slug} />
               </div>
            </TabsContent>

            <TabsContent value="ship" className="mt-0 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                   <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                     <Truck className="w-7 h-7" />
                   </div>
                   <h4 className="font-bold font-heading text-slate-800 text-xl mb-3">Kargo Süreci</h4>
                   <p className="text-slate-600 font-medium leading-relaxed">Siparişiniz 24 saat içinde özenle hazırlanıp kargolanır. 500 TL ve üzeri alışverişlerinizde kargo ücretsizdir.</p>
                 </div>
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                   <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                     <RefreshCcw className="w-7 h-7" />
                   </div>
                   <h4 className="font-bold font-heading text-slate-800 text-xl mb-3">İade Koşulları</h4>
                   <p className="text-slate-600 font-medium leading-relaxed">14 gün içinde koşulsuz iade hakkınız bulunmaktadır. Bitkiler canlı olduğu için iade sürecinde fotoğraf gerekmektedir.</p>
                 </div>
               </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {data?.related?.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold font-heading mb-3">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="product-related-products">
            {data.related.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Mobile Floating Top Add to Cart */}
      <div
        className={`md:hidden fixed top-[72px] left-1/2 -translate-x-1/2 z-40 transition-all duration-[250ms] ease-out pointer-events-none ${showFloatingButton ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 invisible'}`}
      >
        <button
          onClick={onAdd}
          disabled={product.stock <= 0}
          className="flex items-center gap-2 h-12 px-5 bg-primary/90 backdrop-blur-md text-white rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.3)] border border-primary/20 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          data-testid="product-floating-add-to-cart"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold text-[15px] whitespace-nowrap">
            {product.stock > 0 ? 'Sepete Ekle' : 'Tükendi'}
          </span>
        </button>
      </div>
    </div>
  );
}

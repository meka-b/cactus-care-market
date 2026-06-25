import React, { useState, useEffect } from 'react';
import { api, resolveImageUrl } from '@/lib/api';
import { useTemplates } from '@/contexts/TemplateContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Save, Loader2, Trash2, Image as ImageIcon, Link as LinkIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminHeroBanner() {
  const { templates } = useTemplates();
  const activeVariant = templates?.HeroBanner || 'Default';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/admin/products', { params: { search: searchProduct, limit: 50 } });
      setProducts(res.data.items || []);
    } catch (e) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (showProductModal) {
      fetchProducts();
    }
  }, [showProductModal, searchProduct]);

  const [baseContext, setBaseContext] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    content: '',
    focusKeyword: '',
    language: 'tr'
  });

  const [variantFields, setVariantFields] = useState({});

  useEffect(() => {
    fetchHeroSettings();
  }, [activeVariant]);

  const fetchHeroSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings/hero');
      if (data?.baseContext) setBaseContext(data.baseContext);
      if (data?.variantFields && data.variantFields[activeVariant]) {
        setVariantFields(data.variantFields[activeVariant]);
      } else {
        setVariantFields({});
      }
    } catch (err) {
      console.error(err);
      toast.error('Ayarlar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleBaseChange = (field, val) => {
    setBaseContext((prev) => ({ ...prev, [field]: val }));
  };

  const handleVariantChange = (field, val) => {
    setVariantFields((prev) => ({ ...prev, [field]: val }));
  };

  const [uploadingField, setUploadingField] = useState(null);

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data?.url) {
        handleVariantChange(field, data.url);
        toast.success('Görsel başarıyla yüklendi!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Görsel yüklenirken bir hata oluştu.');
    } finally {
      setUploadingField(null);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const renderImageBlock = (label, prefix, recommendedSize) => (
    <div className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <h4 className="font-medium text-slate-800">{label}</h4>
        {recommendedSize && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
            Önerilen: {recommendedSize}
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Görsel URL veya Yükle</label>
          <div className="flex gap-2">
            <Input 
              value={variantFields[`${prefix}Prompt`] || ''} 
              onChange={(e) => handleVariantChange(`${prefix}Prompt`, e.target.value)} 
              placeholder="Görsel URL'si" 
            />
            <div className="relative w-24 flex-shrink-0">
              <Button type="button" variant="outline" disabled={uploadingField === `${prefix}Prompt`} className="w-full relative overflow-hidden">
                {uploadingField === `${prefix}Prompt` ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yükle"}
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload(e, `${prefix}Prompt`)}
                />
              </Button>
            </div>
          </div>
          {variantFields[`${prefix}Prompt`] && !variantFields[`${prefix}Prompt`].startsWith('http') && (
            <img src={api.defaults.baseURL.replace('/api', '') + variantFields[`${prefix}Prompt`]} alt="preview" className="h-16 mt-2 rounded border border-slate-200 object-contain" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Link URL */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tıklama Linki (Örn: /k/kaktusler)</label>
            <Input 
              value={variantFields[`${prefix}Link`] || ''} 
              onChange={(e) => handleVariantChange(`${prefix}Link`, e.target.value)} 
              placeholder="Gidilecek URL" 
            />
          </div>

          {/* SEO Alt Text */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">SEO Alt Metni / Başlık</label>
            <Input 
              value={variantFields[`${prefix}Alt`] || ''} 
              onChange={(e) => handleVariantChange(`${prefix}Alt`, e.target.value)} 
              placeholder="Görseli tanımlayan SEO metni" 
            />
          </div>
        </div>
      </div>
    </div>
  );

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/admin/ai/hero-optimize', {
        variant: activeVariant,
        base_context: baseContext
      });
      if (data.success && data.optimized_content) {
        setVariantFields(data.optimized_content);
        toast.success('AI optimizasyonu tamamlandı!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Optimizasyon başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch latest to update only the active variant
      const currentData = await api.get('/admin/settings/hero');
      const updatedContent = {
        baseContext,
        variantFields: {
          ...(currentData.data?.variantFields || {}),
          [activeVariant]: variantFields
        }
      };
      
      await api.post('/admin/settings/hero', { content: updatedContent });
      toast.success('Başarıyla kaydedildi.');
    } catch (err) {
      console.error(err);
      toast.error('Kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !Object.keys(variantFields).length) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Hero Yönetimi</h1>
        <p className="text-slate-500 mt-2">
          Aktif tasarım: <strong className="text-emerald-600">{activeVariant}</strong>
        </p>
      </div>

      <Card className="p-6 mb-8 border-emerald-100 shadow-emerald-100/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Temel Girdiler (Base Context)</h2>
            <p className="text-sm text-slate-500">AI'ın optimize etmesi için temel verileri girin.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title (Konu)</label>
            <Input value={baseContext.title || ''} onChange={(e) => handleBaseChange('title', e.target.value)} placeholder="Örn: Yaz Kampanyası" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Focus Keyword</label>
            <Input value={baseContext.focusKeyword || ''} onChange={(e) => handleBaseChange('focusKeyword', e.target.value)} placeholder="Örn: ucuz bitkiler" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Kısa Açıklama / İçerik</label>
            <Textarea value={baseContext.content || ''} onChange={(e) => handleBaseChange('content', e.target.value)} placeholder="Kampanyadan kısaca bahsedin..." />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleOptimize} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            AI ile Optimize Et
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">{activeVariant} Tasarım Alanları</h2>
        <div className="space-y-4">
          {activeVariant === 'Default' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Ana Başlık (Main Title)</label>
                <Input value={variantFields.mainTitle || ''} onChange={(e) => handleVariantChange('mainTitle', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alt Metin (Subtitle)</label>
                <Input value={variantFields.subtitle || ''} onChange={(e) => handleVariantChange('subtitle', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Birincil Buton Metni</label>
                  <Input value={variantFields.primaryCtaLabel || ''} onChange={(e) => handleVariantChange('primaryCtaLabel', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birincil Buton Linki</label>
                  <Input value={variantFields.primaryCtaLink || ''} onChange={(e) => handleVariantChange('primaryCtaLink', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">İkincil Buton Metni</label>
                  <Input value={variantFields.secondaryCtaLabel || ''} onChange={(e) => handleVariantChange('secondaryCtaLabel', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">İkincil Buton Linki</label>
                  <Input value={variantFields.secondaryCtaLink || ''} onChange={(e) => handleVariantChange('secondaryCtaLink', e.target.value)} />
                </div>
              </div>
              {renderImageBlock('Ana Görsel', 'mainImage', '900x900 px (Kare)')}
            </>
          )}

          {activeVariant === 'BentoGrid' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Üst Etiket (Badge)</label>
                <Input value={variantFields.badge || ''} onChange={(e) => handleVariantChange('badge', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ana Başlık (Main Title)</label>
                <Input value={variantFields.mainTitle || ''} onChange={(e) => handleVariantChange('mainTitle', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImageBlock('Ana Görsel (Sol Üst)', 'mainImage', '1200x800 px (Yatay)')}
                {renderImageBlock('Sağ Dikey Görsel', 'rightTallImage', '800x1200 px (Dikey)')}
                {renderImageBlock('Küçük Görsel 1 (Sol Alt)', 'bottomLeftImage1', '800x800 px (Kare)')}
                {renderImageBlock('Küçük Görsel 2 (Sol Alt)', 'bottomLeftImage2', '800x800 px (Kare)')}
              </div>
            </>
          )}

          {activeVariant === 'CategoryBentoGrid' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Ana Başlık (Main Title)</label>
                <Input value={variantFields.mainTitle || ''} onChange={(e) => handleVariantChange('mainTitle', e.target.value)} placeholder="IT'S YOUR FIRST TIME?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alt Metin (Subtitle)</label>
                <Input value={variantFields.subtitle || ''} onChange={(e) => handleVariantChange('subtitle', e.target.value)} placeholder="Explore categories!" />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 mb-3">Kutu 1 (Sol Büyük)</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Etiket (Örn: NATURAL NUTS)</label>
                  <Input value={variantFields.box1Label || ''} onChange={(e) => handleVariantChange('box1Label', e.target.value)} />
                </div>
                {renderImageBlock('Görsel (Arka Plan)', 'box1Image', '800x800 px (Kare)')}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 mb-3">Kutu 2 (Orta Üst Sol)</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Etiket (Örn: DRIED FRUITS)</label>
                  <Input value={variantFields.box2Label || ''} onChange={(e) => handleVariantChange('box2Label', e.target.value)} />
                </div>
                {renderImageBlock('Görsel', 'box2Image', '600x600 px (Kare)')}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 mb-3">Kutu 3 (Orta Üst Sağ)</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Etiket (Örn: SUPLEMENTS)</label>
                  <Input value={variantFields.box3Label || ''} onChange={(e) => handleVariantChange('box3Label', e.target.value)} />
                </div>
                {renderImageBlock('Görsel', 'box3Image', '600x600 px (Kare)')}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 mb-3">Kutu 4 (Orta Alt Yatay)</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Etiket (Örn: BARS AND SNACKS)</label>
                  <Input value={variantFields.box4Label || ''} onChange={(e) => handleVariantChange('box4Label', e.target.value)} />
                </div>
                {renderImageBlock('Görsel', 'box4Image', '800x400 px (Yatay)')}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 mb-3">Kutu 5 (Sağ Dikey)</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Etiket (Örn: DRINKS)</label>
                  <Input value={variantFields.box5Label || ''} onChange={(e) => handleVariantChange('box5Label', e.target.value)} />
                </div>
                {renderImageBlock('Görsel', 'box5Image', '600x800 px (Dikey)')}
              </div>
            </>
          )}

          {activeVariant === 'InfiniteMarquee' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Ana Başlık (Main Title)</label>
                <Input value={variantFields.mainTitle || ''} onChange={(e) => handleVariantChange('mainTitle', e.target.value)} placeholder="Discover Exclusive Digital Collectibles" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alt Metin (Subtitle)</label>
                <Input value={variantFields.subtitle || ''} onChange={(e) => handleVariantChange('subtitle', e.target.value)} placeholder="Explore our NFT marketplace..." />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Buton Metni</label>
                  <Input value={variantFields.primaryCtaLabel || ''} onChange={(e) => handleVariantChange('primaryCtaLabel', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Buton Linki</label>
                  <Input value={variantFields.primaryCtaLink || ''} onChange={(e) => handleVariantChange('primaryCtaLink', e.target.value)} />
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700 text-lg">Kayan Görseller (Marquee)</h3>
                  <div className="text-sm text-slate-500">Toplam: {(variantFields.marqueeItems || []).length} Görsel</div>
                </div>

                <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1 flex gap-2">
                    <Input 
                      placeholder="Görsel URL'si ekle (isteğe bağlı)" 
                      value={customUrl} 
                      onChange={(e) => setCustomUrl(e.target.value)} 
                    />
                    <Button variant="secondary" onClick={() => {
                      if(!customUrl) return;
                      handleVariantChange('marqueeItems', [...(variantFields.marqueeItems || []), { type: 'url', image: customUrl }]);
                      setCustomUrl('');
                    }}>
                      URL Ekle
                    </Button>
                  </div>
                  <div className="text-slate-300 flex items-center px-2">veya</div>
                  <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Ürünlerden Seç
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Mevcut Ürünlerden Seç</DialogTitle>
                      </DialogHeader>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Ürün ara..." 
                          className="pl-9" 
                          value={searchProduct} 
                          onChange={(e) => setSearchProduct(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {loadingProducts ? (
                          <div className="col-span-full py-10 text-center text-slate-500">Yükleniyor...</div>
                        ) : products.length === 0 ? (
                          <div className="col-span-full py-10 text-center text-slate-500">Ürün bulunamadı.</div>
                        ) : (
                          products.map(p => (
                            <div key={p.id} className="border border-slate-200 rounded-lg p-3 hover:border-emerald-500 cursor-pointer transition-colors" onClick={() => {
                              const currentItems = variantFields.marqueeItems || [];
                              const newItems = [];
                              
                              if (p.images && p.images.length > 0) {
                                p.images.forEach(imgObj => {
                                  const imgUrl = imgObj.main ? resolveImageUrl(imgObj.main) : (imgObj.thumb ? resolveImageUrl(imgObj.thumb) : 'https://via.placeholder.com/400');
                                  newItems.push({ type: 'product', id: p.id, title: p.common_name_tr, image: imgUrl, link: `/u/${p.slug}` });
                                });
                              } else {
                                newItems.push({ type: 'product', id: p.id, title: p.common_name_tr, image: 'https://via.placeholder.com/400', link: `/u/${p.slug}` });
                              }
                              
                              handleVariantChange('marqueeItems', [...currentItems, ...newItems]);
                              toast.success(`${p.common_name_tr} (${newItems.length} görsel) eklendi`);
                            }}>
                              <div className="aspect-square w-full rounded-md bg-slate-100 overflow-hidden mb-2">
                                {p.images?.[0]?.thumb ? <img src={resolveImageUrl(p.images[0].thumb)} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-300 m-auto mt-8" />}
                              </div>
                              <div className="text-xs font-medium text-slate-800 line-clamp-2">{p.common_name_tr}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {(variantFields.marqueeItems || []).map((item, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-2">
                        {item.type === 'product' && <div className="text-[10px] text-white px-2 text-center line-clamp-2">{item.title}</div>}
                        {item.type === 'url' && <div className="text-[10px] text-white">URL</div>}
                        <Button variant="destructive" size="icon" className="w-8 h-8" onClick={() => {
                          const newItems = [...variantFields.marqueeItems];
                          newItems.splice(idx, 1);
                          handleVariantChange('marqueeItems', newItems);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(variantFields.marqueeItems || []).length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      Henüz görsel eklemediniz. Yukarıdan URL veya ürün seçerek ekleyebilirsiniz.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}


          <div className="pt-4 mt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-3">SEO Ayarları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SEO Title</label>
                <Input value={variantFields.seoTitle || ''} onChange={(e) => handleVariantChange('seoTitle', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SEO Description</label>
                <Textarea value={variantFields.seoDescription || ''} onChange={(e) => handleVariantChange('seoDescription', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Değişiklikleri Kaydet
          </Button>
        </div>
      </Card>
    </div>
  );
}

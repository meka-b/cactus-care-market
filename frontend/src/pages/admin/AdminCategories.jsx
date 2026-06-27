import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Layers, BookOpen, Filter, Grid } from 'lucide-react';
import { toast } from 'sonner';

const defaultItem = (type = '') => ({
  id: crypto.randomUUID(),
  name: '',
  slug: '',
  seo_title: '',
  seo_description: '',
  geo_targeting: '',
  llm_prompt: '',
  serp_keywords: [],
  status: 'active',
  type: type
});

function CategoryList({ items, setItems, title, icon: Icon, filterType = null }) {
  const [expandedId, setExpandedId] = useState(null);

  const addItem = () => setItems([{ ...defaultItem(filterType), name: 'Yeni Öğe', slug: 'yeni-oge' }, ...items]);
  const updateItem = (id, key, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: val } : i));
  const updateItemFields = (id, updates) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  
  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <Card className="p-8 bg-white border-none shadow-sm rounded-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">Bu bölümden {title.toLowerCase()} yönetimi yapabilirsiniz.</p>
        </div>
        <Button onClick={addItem} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl">
          <Plus className="w-4 h-4 mr-2" />Yeni Ekle
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="border border-gray-100 bg-gray-50 rounded-xl overflow-hidden transition-all">
              <div className="flex flex-wrap md:flex-nowrap items-center gap-3 p-4 bg-white">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs text-gray-500 mb-1 block">İsim</Label>
                  <Input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Kategori Adı" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs text-gray-500 mb-1 block">Slug (URL)</Label>
                  <Input value={item.slug} onChange={e => updateItem(item.id, 'slug', e.target.value)} placeholder="ornek-kategori" />
                </div>
                {filterType && (
                  <div className="w-[150px]">
                    <Label className="text-xs text-gray-500 mb-1 block">Filtre Tipi</Label>
                    <Input value={item.type} onChange={e => updateItem(item.id, 'type', e.target.value)} placeholder="Örn: care_level" />
                  </div>
                )}
                <div className="flex items-end gap-2 pt-5">
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(item.id)} className="rounded-xl">
                    {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    Gelişmiş
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        if(!item.name) {
                          toast.error("Önce kategori adını girin");
                          return;
                        }
                        const id = toast.loading("AI ile veriler üretiliyor...");
                        try {
                          const res = await api.post("/admin/categories/generate", { name: item.name, type: title });
                          const generated = res.data;
                          updateItemFields(item.id, {
                            seo_title: generated.seo_title,
                            seo_description: generated.seo_description,
                            geo_targeting: generated.geo_targeting,
                            llm_prompt: generated.llm_prompt,
                            serp_keywords: generated.serp_keywords
                          });
                          toast.success("AI ile başarıyla senkronize edildi", { id });
                        } catch(e) {
                          toast.error("AI üretimi başarısız", { id });
                        }
                      }}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      ✨ AI Senkronize Et
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">SEO Başlığı (Title)</Label>
                    <Input value={item.seo_title || ''} onChange={e => updateItem(item.id, 'seo_title', e.target.value)} placeholder="Arama motorlarında görünecek başlık" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">SEO Açıklaması (Description)</Label>
                    <Input value={item.seo_description || ''} onChange={e => updateItem(item.id, 'seo_description', e.target.value)} placeholder="Arama motorlarında görünecek açıklama" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">GEO Targeting (Bölge/Ülke)</Label>
                    <Input value={item.geo_targeting || ''} onChange={e => updateItem(item.id, 'geo_targeting', e.target.value)} placeholder="Örn: TR, Istanbul" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">SERP Keywords (Virgülle ayırın)</Label>
                    <Input value={(item.serp_keywords || []).join(', ')} onChange={e => updateItem(item.id, 'serp_keywords', e.target.value.split(',').map(s => s.trim()))} placeholder="kaktüs, sukulent, ucuz" className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">LLM Prompt (Yapay Zeka Yönlendirmesi)</Label>
                    <Input value={item.llm_prompt || ''} onChange={e => updateItem(item.id, 'llm_prompt', e.target.value)} placeholder="RAG sistemi bu kategori sorulduğunda nasıl davranmalı?" className="mt-1" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl">Kayıt bulunamadı</div>}
      </div>
    </Card>
  );
}

export default function AdminCategories() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/categories/all');
      const dataObj = res.data;
      setData({
        product_categories: dataObj.product_categories || [],
        blog_categories: dataObj.blog_categories || [],
        collections: dataObj.collections || [],
        filters: dataObj.filters || []
      });
    } catch (e) {
      toast.error('Kategoriler yüklenemedi');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/admin/categories/save', data);
      toast.success('Tüm kategori ve filtre ayarları başarıyla kaydedildi');
    } catch (e) {
      toast.error('Kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Kategoriler ve SEO</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tüm içerik mimarisini, etiketleri ve arama motoru / yapay zeka optimizasyonlarını yönetin.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl px-6">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 p-1 bg-white border border-gray-100 rounded-xl inline-flex w-auto shadow-sm">
          <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Ürün Kategorileri</TabsTrigger>
          <TabsTrigger value="blogs" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Blog Kategorileri</TabsTrigger>
          <TabsTrigger value="collections" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Koleksiyonlar</TabsTrigger>
          <TabsTrigger value="filters" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Filtreler</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="outline-none mt-0">
          <CategoryList 
            title="Ürün Kategorileri" 
            icon={Grid} 
            items={data.product_categories} 
            setItems={items => setData(prev => ({ ...prev, product_categories: typeof items === 'function' ? items(prev.product_categories) : items }))} 
          />
        </TabsContent>

        <TabsContent value="blogs" className="outline-none mt-0">
          <CategoryList 
            title="Blog Kategorileri" 
            icon={BookOpen} 
            items={data.blog_categories} 
            setItems={items => setData(prev => ({ ...prev, blog_categories: typeof items === 'function' ? items(prev.blog_categories) : items }))} 
          />
        </TabsContent>

        <TabsContent value="collections" className="outline-none mt-0">
          <CategoryList 
            title="Koleksiyonlar" 
            icon={Layers} 
            items={data.collections} 
            setItems={items => setData(prev => ({ ...prev, collections: typeof items === 'function' ? items(prev.collections) : items }))} 
          />
        </TabsContent>

        <TabsContent value="filters" className="outline-none mt-0">
          <CategoryList 
            title="Filtreler" 
            icon={Filter} 
            items={data.filters} 
            filterType="care_level"
            setItems={items => setData(prev => ({ ...prev, filters: typeof items === 'function' ? items(prev.filters) : items }))} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

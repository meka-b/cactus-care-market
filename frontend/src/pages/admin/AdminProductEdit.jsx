import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, resolveImageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Upload, Trash2, X, Settings, Image as ImageIcon, Search, Leaf, Package } from 'lucide-react';
import { toast } from 'sonner';
import { AdvancedGuideEditor } from '@/components/admin/AdvancedGuideEditor';
import { useSEO } from '@/lib/seo';
import { motion, AnimatePresence } from 'framer-motion';
import LexicalEditor from '@/components/editor/LexicalEditor';

const CATEGORIES = ['Kaktüsler', 'Sukulentler', 'İç Mekan Bitkileri', 'Dış Mekan Bitkileri', 'Meyve Fidanları', 'Çiçekler', 'Tırmanıcı Bitkiler', 'Palmiyeler', 'Bonsailer'];
const CARE = ['Kolay Bakım', 'Orta Bakım', 'Uzman Bakım'];
const LIGHT = ['Tam Güneş', 'Yarı Gölge', 'Gölge'];
const WATER = ['Az', 'Orta', 'Yüksek'];
const SIZES = ['Mini (0-20 cm)', 'Küçük (20-50 cm)', 'Orta (50-100 cm)', 'Büyük (100+ cm)'];
const POT_SIZES = ['5.5 CM', '8.5 CM', '10.5 CM', '12 CM', '15 CM', '17 CM', '21 CM'];

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState(null); // 'settings', 'care', 'gallery', 'seo'

  useSEO({ title: 'Ürün Düzenle - Yönetim' });

  useEffect(() => {
    api.get('/admin/products', { params: { limit: 200 } }).then(r => {
      const p = r.data.items.find(x => x.id === id);
      if (!p) { toast.error('Ürün bulunamadı'); navigate('/admin/urunler'); return; }
      
      let parsedDesc = p.description || '';
      try {
        if (typeof p.description === 'string' && p.description.startsWith('{')) {
          parsedDesc = JSON.parse(p.description);
        }
      } catch (e) {}

      setForm({ ...p, description: parsedDesc, care_tips: p.care_tips || [], advanced_guide: p.advanced_guide || { enabled: false, sections: {} } });
      setLoading(false);
    }).catch(() => { toast.error('Ürün yüklenemedi'); setLoading(false); });
  }, [id, navigate]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form || !form.common_name_tr?.trim()) { toast.error('Ürün adı zorunludur'); return; }
    setSaving(true);
    try {
      const payload = {
        common_name_tr: form.common_name_tr,
        scientific_species: form.scientific_species || null,
        slug: form.slug,
        category: form.category,
        care_level: form.care_level,
        light_need: form.light_need,
        water_need: form.water_need,
        size: form.size,
        pet_safe: !!form.pet_safe,
        pot_size: form.pot_size || null,
        short_description: form.short_description || '',
        description: typeof form.description === 'object' ? JSON.stringify(form.description) : (form.description || ''),
        care_tips: form.care_tips || [],
        advanced_guide: form.advanced_guide,
        meta_title: form.meta_title || '',
        meta_description: form.meta_description || '',
        images: form.images || [],
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        is_published: !!form.is_published,
        is_featured: !!form.is_featured,
      };
      await api.patch(`/admin/products/${id}`, payload);
      toast.success('Ürün başarıyla güncellendi');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Güncelleme başarısız');
    } finally { setSaving(false); }
  };

  const onUploadImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingImg(true);
    try {
      const fd = new FormData(); fd.append('file', f);
      fd.append('generate_alt', 'true');
      const r = await api.post(`/admin/products/${id}/images/add`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, images: r.data.product.images }));
      toast.success('Görsel galeriye eklendi');
      e.target.value = '';
    } catch { toast.error('Görsel yüklenemedi'); } finally { setUploadingImg(false); }
  };

  const deleteImage = async (idx) => {
    toast('Bu görsel silinsin mi?', {
      action: {
        label: 'Sil',
        onClick: async () => {
          try {
            const r = await api.delete(`/admin/products/${id}/images/${idx}`);
            setForm(prev => ({ ...prev, images: r.data.images }));
            toast.success('Görsel silindi');
          } catch { toast.error('Silinemedi'); }
        }
      },
      cancel: { label: 'İptal' }
    });
  };

  const updateAlt = async (idx, alt) => {
    setForm(prev => {
      const imgs = [...(prev.images || [])];
      if (imgs[idx]) imgs[idx] = { ...imgs[idx], alt };
      return { ...prev, images: imgs };
    });
  };

  const saveAlt = async (idx) => {
    const alt = form.images?.[idx]?.alt || '';
    try {
      await api.patch(`/admin/products/${id}/images/${idx}/alt`, { alt });
      toast.success('Alt metin kaydedildi');
    } catch { toast.error('Kaydedilemedi'); }
  };

  const moveImage = async (idx, dir) => {
    const imgs = [...(form.images || [])];
    const ni = idx + dir;
    if (ni < 0 || ni >= imgs.length) return;
    const order = imgs.map((_, i) => i);
    [order[idx], order[ni]] = [order[ni], order[idx]];
    try {
      const r = await api.post(`/admin/products/${id}/images/reorder`, { order });
      setForm(prev => ({ ...prev, images: r.data.images }));
    } catch { toast.error('Sıralama hatası'); }
  };

  if (loading) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  const SidebarBtn = ({ icon: Icon, label, id }) => (
    <button 
      onClick={() => setActiveTab(activeTab === id ? null : id)}
      className={`flex flex-col items-center justify-center gap-1.5 w-14 h-14 transition-colors ${activeTab === id ? 'text-emerald-600 bg-emerald-50 rounded-xl' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans h-screen overflow-hidden text-slate-800" data-testid="admin-product-editor-fullscreen">
      
      {/* TOP HEADER */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-white shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-600 gap-2 px-2 hover:bg-slate-100" onClick={() => navigate('/admin/urunler')}>
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Listeye Dön</span>
          </Button>
          <div className="h-4 w-px bg-slate-300 hidden sm:block" />
          <span className="text-sm font-medium hidden sm:block">
            {form.is_published ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Yayında</Badge> : <Badge variant="outline" className="text-slate-500">Taslak</Badge>}
          </span>
          {form.is_featured && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Öne Çıkan</Badge>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {saving && <span className="text-xs text-slate-400 mr-2 flex items-center gap-1"><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/> Kaydediliyor</span>}
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-md">
            <Save className="w-4 h-4 mr-2" />
            Değişiklikleri Kaydet
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR (ICONS) */}
        <aside className="w-[72px] border-r border-slate-200 bg-slate-50/50 flex flex-col items-center py-6 gap-4 shrink-0 z-20">
          <SidebarBtn icon={Settings} label="Ayarlar" id="settings" />
          <SidebarBtn icon={Leaf} label="Bakım" id="care" />
          <SidebarBtn icon={ImageIcon} label="Görseller" id="gallery" />
          <SidebarBtn icon={Search} label="SEO" id="seo" />
        </aside>

        {/* SLIDE-OUT PANEL */}
        <AnimatePresence>
          {activeTab && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="border-r border-slate-200 bg-white flex flex-col h-full shrink-0 shadow-2xl z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 w-[340px]">
                <h3 className="font-semibold text-base font-heading text-slate-800">
                  {activeTab === 'settings' && 'Temel Ayarlar'}
                  {activeTab === 'care' && 'Bitki & Bakım Özellikleri'}
                  {activeTab === 'gallery' && 'Görsel Galerisi'}
                  {activeTab === 'seo' && 'Arama Motoru (SEO)'}
                </h3>
                <button onClick={() => setActiveTab(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto w-[340px] p-5">
                
                {activeTab === 'settings' && (
                  <div className="space-y-5">
                    <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.is_published} onCheckedChange={v => upd('is_published', !!v)} /> <span className="text-sm font-medium">Yayında</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.is_featured} onCheckedChange={v => upd('is_featured', !!v)} /> <span className="text-sm font-medium">Öne Çıkar</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.pet_safe} onCheckedChange={v => upd('pet_safe', !!v)} /> <span className="text-sm font-medium">Pet Safe</span></label>
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Kategori</Label>
                      <Select value={form.category} onValueChange={v => upd('category', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Fiyat (₺)</Label>
                        <Input type="number" step="0.01" value={form.price} onChange={e => upd('price', e.target.value)} className="bg-slate-50" />
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Stok Adedi</Label>
                        <Input type="number" value={form.stock} onChange={e => upd('stock', e.target.value)} className="bg-slate-50" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Otomatik Etiketler</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {(form.tags || []).map(t => <span key={t} className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md">#{t}</span>)}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'care' && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bilimsel Ad</Label>
                      <Input value={form.scientific_name} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" title="Bilimsel isim Wikipedia'dan otomatik çekilir" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bilimsel Tür (Koleksiyon / Alt Tür)</Label>
                      <Input value={form.scientific_species || ''} onChange={e => upd('scientific_species', e.target.value)} placeholder="Örn: Echinopsis, Variegata..." className="bg-slate-50" />
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bakım Zorluğu</Label>
                      <Select value={form.care_level} onValueChange={v => upd('care_level', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">{CARE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Işık İhtiyacı</Label>
                      <Select value={form.light_need} onValueChange={v => upd('light_need', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">{LIGHT.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Su İhtiyacı</Label>
                      <Select value={form.water_need} onValueChange={v => upd('water_need', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">{WATER.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bitki Boyutu</Label>
                      <Select value={form.size} onValueChange={v => upd('size', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">{SIZES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Saksı Çapı</Label>
                      <Select value={form.pot_size || ''} onValueChange={v => upd('pot_size', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue placeholder="Seçiniz (Opsiyonel)" /></SelectTrigger>
                        <SelectContent className="bg-white">{POT_SIZES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div className="space-y-4">
                    <label className="block border-2 border-dashed border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl p-6 text-center cursor-pointer transition-colors group">
                      <input type="file" accept="image/*" onChange={onUploadImage} className="hidden" />
                      <Upload className="w-8 h-8 mx-auto text-emerald-300 group-hover:text-emerald-500 mb-3 transition-colors" />
                      <div className="text-sm text-slate-600 font-medium group-hover:text-emerald-700">{uploadingImg ? 'AI ile alt metin üretiliyor...' : 'Yeni Görsel Ekle'}</div>
                      <div className="text-[10px] text-slate-400 mt-1">İlk görsel kapak olarak kullanılır. Alt metin SEO için otomatik üretilir.</div>
                    </label>

                    <div className="space-y-3 mt-4">
                      {(form.images || []).map((im, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex gap-3 group relative transition-all hover:shadow-md">
                          <img src={resolveImageUrl(im.thumb || im.main)} alt={im.alt} className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-1">
                              {idx === 0 && <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Kapak</span>}
                              <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                            </div>
                            <Input
                              value={im.alt || ''}
                              onChange={e => updateAlt(idx, e.target.value)}
                              onBlur={() => saveAlt(idx)}
                              placeholder="Alt metin (SEO)"
                              className="h-7 text-xs bg-white border-slate-200 mb-2"
                            />
                            <div className="flex gap-1 justify-between">
                              <div className="flex gap-1">
                                <Button type="button" size="sm" variant="outline" className="h-6 w-6 p-0 text-xs text-slate-500" onClick={() => moveImage(idx, -1)} disabled={idx === 0}>↑</Button>
                                <Button type="button" size="sm" variant="outline" className="h-6 w-6 p-0 text-xs text-slate-500" onClick={() => moveImage(idx, 1)} disabled={idx === (form.images || []).length - 1}>↓</Button>
                              </div>
                              <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteImage(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">URL Bağlantısı (Slug)</Label>
                      <Input value={form.slug} onChange={e => upd('slug', e.target.value)} placeholder="ornek-urun-url" className="bg-slate-50" />
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <Label className="text-[11px] mb-1.5 block text-slate-600">Meta Başlık</Label>
                      <Input value={form.meta_title || ''} onChange={e => upd('meta_title', e.target.value)} className="bg-slate-50 h-9" />
                      <div className="text-[9px] font-medium text-slate-400 mt-1.5 text-right">{(form.meta_title || '').length}/60</div>
                    </div>
                    <div>
                      <Label className="text-[11px] mb-1.5 block text-slate-600">Meta Açıklama</Label>
                      <Textarea rows={4} value={form.meta_description || ''} onChange={e => upd('meta_description', e.target.value)} className="resize-none text-sm bg-slate-50" />
                      <div className="text-[9px] font-medium text-slate-400 mt-1.5 text-right">{(form.meta_description || '').length}/160</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN EDITOR AREA */}
        <main 
          className="flex-1 overflow-y-auto bg-white relative cursor-text scroll-smooth" 
          onClick={(e) => {
             if (e.target.tagName === 'MAIN' || e.target.classList.contains('main-editor-wrapper')) setActiveTab(null);
          }}
        >
          <div className="max-w-5xl mx-auto py-16 px-8 lg:px-16 min-h-full main-editor-wrapper">
             
             {/* PRODUCT TITLE */}
             <input 
               value={form.common_name_tr} 
               onChange={e => upd('common_name_tr', e.target.value)} 
               placeholder="Ürün Adı" 
               className="w-full text-4xl sm:text-5xl lg:text-[54px] font-bold font-heading text-slate-900 placeholder-slate-200 border-none outline-none mb-6 bg-transparent leading-tight"
             />

             {/* SHORT DESCRIPTION */}
             <div className="mb-10">
               <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 block ml-1">Öne Çıkan Cümle (Kısa Açıklama)</Label>
               <Textarea 
                 value={form.short_description || ''} 
                 onChange={e => upd('short_description', e.target.value)} 
                 placeholder="Ürünü çekici kılan kısa bir özet yazın..." 
                 className="w-full text-lg sm:text-xl font-medium text-slate-600 placeholder-slate-300 border-none outline-none resize-none bg-slate-50/50 focus-visible:ring-0 p-4 rounded-xl min-h-[100px]"
               />
             </div>

             {/* LONG DESCRIPTION */}
             <div className="mb-10">
               <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 block ml-1">Detaylı İçerik</Label>
               <div className="editor-clean-wrapper border-none">
                 <LexicalEditor 
                   content={form.description} 
                   onChange={json => upd('description', json)}
                   onUploadImage={async (file) => {
                     const fd = new FormData();
                     fd.append('file', file);
                     const r = await api.post(`/admin/products/${id}/images/add`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                     return resolveImageUrl(r.data.product.images[r.data.product.images.length - 1].main);
                   }}
                 />
               </div>
             </div>

             {/* QUICK CARE TIPS */}
             <div className="mb-16 bg-emerald-50/50 p-6 sm:p-8 rounded-[20px] border border-emerald-100">
               <Label className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-emerald-600 mb-4 ml-1">
                 <Leaf className="w-4 h-4" /> Hızlı Bakım İpuçları (Madde Madde)
               </Label>
               <Textarea 
                 rows={5} 
                 value={(form.care_tips || []).join('\n')} 
                 onChange={e => upd('care_tips', e.target.value.split('\n').filter(s => s.trim()))} 
                 placeholder="Her satıra bir ipucu gelecek şekilde yazın...&#10;Örn: Doğrudan güneş ışığından koruyun."
                 className="w-full text-base text-emerald-800 placeholder-emerald-200 border-none outline-none resize-none bg-transparent p-0 focus-visible:ring-0"
               />
             </div>

             {/* ADVANCED GUIDE EDITOR */}
             <div className="mt-16 pt-16 border-t border-slate-100">
               <AdvancedGuideEditor 
                 value={form.advanced_guide} 
                 onChange={(val) => upd('advanced_guide', val)} 
               />
             </div>
             
             <div className="mt-24 text-center opacity-40 select-none pointer-events-none pb-20">
                <Package className="w-6 h-6 mx-auto mb-3 text-emerald-600" />
                <p className="text-sm font-medium text-slate-600">Her ürün yeşil dünyanıza eklenecek taze bir nefes!</p>
             </div>
          </div>
        </main>

      </div>
    </div>
  );
}

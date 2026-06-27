import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Wand2, CheckCircle2, Sparkles, X, Settings, Image as ImageIcon, Search, Leaf, Package, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';
import { motion, AnimatePresence } from 'framer-motion';
import LexicalEditor from '@/components/editor/LexicalEditor';

const CATEGORIES = ['Kaktüsler', 'Sukulentler', 'İç Mekan Bitkileri', 'Dış Mekan Bitkileri', 'Meyve Fidanları', 'Çiçekler', 'Tırmanıcı Bitkiler', 'Palmiyeler', 'Bonsailer'];
const CARE = ['Kolay Bakım', 'Orta Bakım', 'Uzman Bakım'];
const LIGHT = ['Tam Güneş', 'Yarı Gölge', 'Gölge'];
const WATER = ['Az', 'Orta', 'Yüksek'];
const SIZES = ['Mini (0-20 cm)', 'Küçük (20-50 cm)', 'Orta (50-100 cm)', 'Büyük (100+ cm)'];
const POT_SIZES = ['5.5 CM', '8.5 CM', '10.5 CM', '12 CM', '15 CM', '17 CM', '21 CM'];

const DEFAULT_FORM = {
  common_name_tr: '',
  scientific_name: '',
  scientific_species: '',
  slug: '',
  category: '',
  care_level: '',
  light_need: '',
  water_need: '',
  size: '',
  pet_safe: false,
  pot_size: '',
  price: '',
  stock: '',
  short_description: '',
  description: '',
  care_tips: [],
  meta_title: '',
  meta_description: '',
  advanced_guide: { enabled: false, sections: {} },
  is_published: true,
  is_featured: false,
};

export default function AdminAIAdd() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [images, setImages] = useState([]); // backend'den dönen {main, thumb, alt} listesi
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState(null);

  useSEO({ title: 'AI Ürün Ekle - Yönetim' });

  const onFiles = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const syncWithAI = async () => {
    if (!files.length && !form.common_name_tr) {
      toast.error('Lütfen en az bir görsel yükleyin veya ürün adı girin');
      return;
    }
    
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('form_data', JSON.stringify(form));
      
      const r = await api.post('/admin/ai/sync', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      const aiData = r.data.suggestion;
      setImages(r.data.images);
      
      setForm(prev => ({
        ...prev,
        ...aiData,
        price: prev.price || aiData.price || '',
        stock: prev.stock || aiData.stock || '',
        pot_size: prev.pot_size || aiData.pot_size || '',
        care_tips: aiData.care_tips || prev.care_tips,
      }));
      
      toast.success('AI Senkronizasyonu tamamlandı - Eksik alanlar dolduruldu');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI analiz hatası');
    } finally { 
      setLoading(false); 
    }
  };

  const publish = async () => {
    if (!form.common_name_tr) { toast.error('Ürün adı (Türkçe) zorunludur'); return; }
    if (!images.length && !files.length) { toast.error('En az 1 görsel zorunludur'); return; }
    
    if (files.length > 0 && images.length === 0) {
      toast.error('Lütfen yayınlamadan önce AI Senkronize butonuna basarak görselleri sisteme yükleyin');
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        scientific_name: form.scientific_name || form.common_name_tr,
        scientific_species: form.scientific_species || null,
        common_name_tr: form.common_name_tr,
        slug: form.slug,
        category: form.category || CATEGORIES[0],
        care_level: form.care_level || CARE[0],
        light_need: form.light_need || LIGHT[0],
        water_need: form.water_need || WATER[0],
        size: form.size || SIZES[0],
        pet_safe: !!form.pet_safe,
        pot_size: form.pot_size || null,
        short_description: form.short_description || '',
        description: typeof form.description === 'object' ? JSON.stringify(form.description) : (form.description || ''),
        care_tips: form.care_tips || [],
        meta_title: form.meta_title || '',
        meta_description: form.meta_description || '',
        advanced_guide: form.advanced_guide,
        images: images.map((img, i) => ({
          main: img.main,
          thumb: img.thumb,
          alt: img.alt || `${form.common_name_tr} görsel ${i+1}`
        })),
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        is_published: !!form.is_published,
        is_featured: !!form.is_featured,
      };
      const r = await api.post('/admin/products', payload);
      toast.success(`${r.data.common_name_tr} başarıyla eklendi`);
      navigate('/admin/urunler');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yayına alma başarısız');
    } finally { setPublishing(false); }
  };

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const SidebarBtn = ({ icon: Icon, label, id }) => (
    <button 
      onClick={() => setActiveTab(activeTab === id ? null : id)}
      className={`flex flex-col items-center justify-center gap-1.5 w-14 h-14 transition-colors ${activeTab === id ? 'text-indigo-600 bg-indigo-50 rounded-xl' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans h-screen overflow-hidden text-slate-800" data-testid="admin-ai-add-fullscreen">
      
      {/* TOP HEADER */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-white shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-600 gap-2 px-2 hover:bg-slate-100" onClick={() => navigate('/admin/urunler')}>
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">İptal</span>
          </Button>
          <div className="h-4 w-px bg-slate-300 hidden sm:block" />
          <span className="text-sm font-medium hidden sm:block">
            <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">AI Destekli Yeni Ürün</Badge>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button onClick={syncWithAI} disabled={loading} variant="secondary" className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full px-5 shadow-sm transition-all">
            {loading ? <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> : <Wand2 className="w-4 h-4 mr-2" />}
            {loading ? 'Senkronize Ediliyor...' : 'AI Senkronize'}
          </Button>
          <Button onClick={publish} disabled={publishing || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-md transition-all">
            {publishing ? 'Kaydediliyor...' : <><CheckCircle2 className="w-4 h-4 mr-2" /> Yayınla</>}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR (ICONS) */}
        <aside className="w-[72px] border-r border-slate-200 bg-slate-50/50 flex flex-col items-center py-6 gap-4 shrink-0 z-20">
          <SidebarBtn icon={ImageIcon} label="Görseller" id="gallery" />
          <SidebarBtn icon={Settings} label="Ayarlar" id="settings" />
          <SidebarBtn icon={Leaf} label="Bakım" id="care" />
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
                  {activeTab === 'gallery' && 'Görsel Yükleme (AI)'}
                  {activeTab === 'seo' && 'Arama Motoru (SEO)'}
                </h3>
                <button onClick={() => setActiveTab(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto w-[340px] p-5">
                
                {activeTab === 'gallery' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-100 text-[11px] text-indigo-700 mb-4 leading-relaxed">
                      <strong>İpucu:</strong> Ürünün fotoğrafını yükleyip <strong>AI Senkronize</strong> butonuna basarsanız, sistem fotoğrafı analiz eder ve tüm bitki özelliklerini sizin yerinize otomatik doldurur.
                    </div>
                    <label className="block border-2 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-xl p-6 text-center cursor-pointer transition-colors group">
                      <input type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
                      <Upload className="w-8 h-8 mx-auto text-indigo-300 group-hover:text-indigo-500 mb-3 transition-colors" />
                      <div className="text-sm text-slate-600 font-medium group-hover:text-indigo-700">Görsel Seç / Sürükle</div>
                      <div className="text-[10px] text-slate-400 mt-1">Çoklu resim yükleyebilirsiniz</div>
                    </label>

                    <div className="space-y-3 mt-4">
                      {previews.map((preview, idx) => (
                        <div key={idx} className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <img src={preview} alt={`preview ${idx}`} className="w-full h-32 object-cover" />
                          <button 
                            onClick={() => removeFile(idx)} 
                            className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {images[idx]?.alt && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-[10px] p-2 line-clamp-2 leading-snug">
                              <span className="font-bold text-indigo-400">AI Analizi:</span> {images[idx].alt}
                            </div>
                          )}
                        </div>
                      ))}
                      {previews.length === 0 && (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs font-medium">Fotoğraf bekleniyor...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-5">
                    <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.is_published} onCheckedChange={v => upd('is_published', !!v)} /> <span className="text-sm font-medium">Yayınla</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.is_featured} onCheckedChange={v => upd('is_featured', !!v)} /> <span className="text-sm font-medium">Öne Çıkar</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.pet_safe} onCheckedChange={v => upd('pet_safe', !!v)} /> <span className="text-sm font-medium">Pet Safe</span></label>
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Kategori</Label>
                      <Select value={form.category} onValueChange={v => upd('category', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
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
                  </div>
                )}

                {activeTab === 'care' && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bilimsel Ad</Label>
                      <Input value={form.scientific_name} onChange={e => upd('scientific_name', e.target.value)} className="bg-slate-50" placeholder="AI tarafından otomatik bulunur" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bilimsel Tür (Koleksiyon / Alt Tür)</Label>
                      <Input value={form.scientific_species || ''} onChange={e => upd('scientific_species', e.target.value)} placeholder="Örn: Variegata..." className="bg-slate-50" />
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bakım Zorluğu</Label>
                      <Select value={form.care_level} onValueChange={v => upd('care_level', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent className="bg-white">{CARE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Işık İhtiyacı</Label>
                      <Select value={form.light_need} onValueChange={v => upd('light_need', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent className="bg-white">{LIGHT.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Su İhtiyacı</Label>
                      <Select value={form.water_need} onValueChange={v => upd('water_need', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent className="bg-white">{WATER.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Bitki Boyutu</Label>
                      <Select value={form.size} onValueChange={v => upd('size', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
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
                     const r = await api.post('/admin/blog/upload-image', fd);
                     return resolveImageUrl(r.data.url);
                   }}
                 />
               </div>
             </div>

             {/* QUICK CARE TIPS */}
             <div className="mb-16 bg-indigo-50/50 p-6 sm:p-8 rounded-xl border border-indigo-100">
               <Label className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-indigo-600 mb-4 ml-1">
                 <Leaf className="w-4 h-4" /> Hızlı Bakım İpuçları (Madde Madde)
               </Label>
               <Textarea 
                 rows={5} 
                 value={(form.care_tips || []).join('\n')} 
                 onChange={e => upd('care_tips', e.target.value.split('\n').filter(s => s.trim()))} 
                 placeholder="Her satıra bir ipucu gelecek şekilde yazın...&#10;Örn: Doğrudan güneş ışığından koruyun."
                 className="w-full text-base text-indigo-800 placeholder-indigo-200 border-none outline-none resize-none bg-transparent p-0 focus-visible:ring-0"
               />
             </div>
             
             <div className="mt-24 text-center opacity-40 select-none pointer-events-none pb-20">
                <Wand2 className="w-6 h-6 mx-auto mb-3 text-indigo-600" />
                <p className="text-sm font-medium text-slate-600">AI asistanı, görseli yüklediğiniz an tüm formu sihir gibi doldurur!</p>
             </div>
          </div>
        </main>

      </div>
    </div>
  );
}

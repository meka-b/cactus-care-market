import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, resolveImageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Save, Image as ImageIcon, Sparkles, ArrowLeft, Settings, Package, Search, Brain, X, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';
import { motion, AnimatePresence } from 'framer-motion';

import LexicalEditor from '@/components/editor/LexicalEditor';
import AIResearchPanel from '@/components/editor/AIResearchPanel';
import ExaSidebar from '@/components/editor/plugins/ExaSidebar';
import { $createParagraphNode, $createTextNode, $insertNodes, $getSelection, $getRoot } from 'lexical';
import { $createLinkNode } from '@lexical/link';

const EMPTY = { title: '', slug: '', excerpt: '', cover_image: '', meta_title: '', meta_description: '', category: '', tags: [], status: 'draft', author_name: 'Yeşil Dükkan', related_product_ids: [] };

export default function AdminBlogEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'yeni';
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [postId, setPostId] = useState(isNew ? null : id);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState(null); // 'settings', 'seo', 'products', 'ai'
  const editorRef = useRef(null);

  const [blogCategories, setBlogCategories] = useState([]);

  useSEO({ title: (isNew ? 'Yeni Yazı' : 'Yazı Düzenle') + ' - Yönetim' });

  useEffect(() => {
    api.get('/admin/categories/all').then(r => setBlogCategories(r.data?.blog_categories || [])).catch(() => {});
    if (isNew) return;
    api.get(`/admin/blog/${id}`).then(r => {
      const p = r.data;
      setForm({
        title: p.title || '',
        slug: p.slug || '',
        excerpt: p.excerpt || '',
        cover_image: p.cover_image || '',
        meta_title: p.meta_title || '',
        meta_description: p.meta_description || '',
        category: p.category || '',
        tags: p.tags || [],
        status: p.status || 'draft',
        author_name: p.author_name || 'Yeşil Dükkan',
        related_product_ids: p.related_product_ids || [],
        _content: p.content || { blocks: [] },
      });
      if ((p.related_product_ids || []).length) {
        api.get('/admin/products', { params: { limit: 200 } }).then(rr => {
          const map = new Map(rr.data.items.map(x => [x.id, x]));
          setRelatedProducts((p.related_product_ids || []).map(pid => map.get(pid)).filter(Boolean));
        });
      }
      setLoading(false);
    }).catch(() => { toast.error('Yazı yüklenemedi'); setLoading(false); });
  }, [id, isNew]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onUploadCover = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      const r = await api.post('/admin/blog/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      upd('cover_image', r.data.url);
      toast.success('Kapak görseli yüklendi');
    } catch { toast.error('Yükleme hatası'); }
  };

  const runAISEO = async () => {
    if (!form.title) { toast.error('Önce başlık yazın'); return; }
    setAiLoading(true);
    try {
      const r = await api.post('/admin/ai/blog-seo', {
        title: form.title,
        excerpt: form.excerpt,
        target_keywords: '',
      });
      const ai = r.data;
      setForm(f => ({
        ...f,
        slug: ai.slug || f.slug,
        meta_title: ai.meta_title || f.meta_title,
        meta_description: ai.meta_description || f.meta_description,
        tags: ai.tags && ai.tags.length ? ai.tags : f.tags,
        excerpt: f.excerpt || ai.hook || '',
      }));
      toast.success('AI SEO önerileri uygulandı');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI hatası');
    } finally { setAiLoading(false); }
  };

  const handleRagGenerate = async () => {
    if (!form.title) return toast.error('Önce bir başlık (konu) yazmalısınız.');
    setAiLoading(true);
    try {
      const { data } = await api.post('/admin/rag/generate', { prompt: `Lütfen şu başlık için bir blog yazısı üret: "${form.title}"` });
      if (form._content && form._content.content) {
        setForm(f => ({ ...f, _content: { ...f._content, content: [...f._content.content, { type: 'paragraph', content: [{ type: 'text', text: data.content }] }] } }));
      }
      toast.success('RAG veritabanı taranarak makale üretildi!');
    } catch (e) {
      toast.error('RAG ile üretim hatası.');
    } finally { setAiLoading(false); }
  };

  const handleInsertText = (text) => {
    if (!text) return;
    if (editorRef.current) {
      editorRef.current.update(() => {
        const paragraphs = String(text).split('\n').map(s => s.trim()).filter(Boolean);
        if (paragraphs.length === 0) return;
        
        const nodesToInsert = paragraphs.map(pText => {
          const p = $createParagraphNode();
          p.append($createTextNode(pText));
          return p;
        });
        const selection = $getSelection();
        if (selection) {
          $insertNodes(nodesToInsert);
        } else {
          const root = $getRoot();
          nodesToInsert.forEach(n => root.append(n));
        }
      });
      toast.success('İçerik editöre eklendi.');
    }
  };

  const save = async (publish = false) => {
    if (!form.title.trim()) { toast.error('Başlık zorunlu'); return; }
    setSaving(true);
    try {
      const content = form._content || {};
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt,
        cover_image: form.cover_image || null,
        content,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        tags: form.tags,
        author_name: form.author_name,
        related_product_ids: form.related_product_ids || [],
        status: publish ? 'published' : form.status,
      };
      if (isNew && !postId) {
        const r = await api.post('/admin/blog', payload);
        setPostId(r.data.id);
        toast.success(publish ? 'Yayınlandı' : 'Taslak kaydedildi');
        navigate(`/admin/blog/${r.data.id}`, { replace: true });
      } else {
        await api.patch(`/admin/blog/${postId}`, payload);
        toast.success(publish ? 'Yayınlandı' : 'Güncellendi');
        if (publish) upd('status', 'published');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kaydedilemedi');
    } finally { setSaving(false); }
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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans h-screen overflow-hidden text-slate-800" data-testid="wix-blog-editor">
      
      {/* TOP HEADER */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-white shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-600 gap-2 px-2 hover:bg-slate-100" onClick={() => navigate('/admin/blog')}>
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Geri</span>
          </Button>
          <div className="h-4 w-px bg-slate-300 hidden sm:block" />
          <span className="text-sm font-medium hidden sm:block">
            {form.status === 'published' ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Yayında</Badge> : <Badge variant="outline" className="text-slate-500">Taslak</Badge>}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {saving && <span className="text-xs text-slate-400 mr-2 flex items-center gap-1"><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/> Kaydediliyor</span>}
          <Button variant="ghost" onClick={() => save(false)} disabled={saving} className="text-slate-600 hidden sm:flex hover:bg-slate-100">Taslak Kaydet</Button>
          <Button onClick={() => save(true)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-md">Yayınla</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR (ICONS) */}
          <aside className="w-[72px] border-r border-slate-200 bg-slate-50/50 flex flex-col items-center py-6 gap-4 shrink-0 z-20">
          <SidebarBtn icon={Settings} label="Ayarlar" id="settings" />
          <SidebarBtn icon={Search} label="SEO" id="seo" />
          <SidebarBtn icon={Sparkles} label="AI Araçlar" id="ai" />
          <SidebarBtn icon={Globe} label="Exa" id="exa" />
          <SidebarBtn icon={Package} label="Ürünler" id="products" />
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
                  {activeTab === 'settings' && 'Yazı Ayarları'}
                  {activeTab === 'seo' && 'SEO ve Kapak Görseli'}
                  {activeTab === 'ai' && 'Yapay Zeka Araçları'}
                  {activeTab === 'products' && 'İlgili Ürünler'}
                  {activeTab === 'exa' && 'Exa AI Asistan'}
                </h3>
                <button onClick={() => setActiveTab(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className={`flex-1 overflow-y-auto w-[340px] ${activeTab === 'exa' ? 'p-0' : 'p-5'}`}>
                {activeTab === 'exa' && (
                  <ExaSidebar onInsert={handleInsertText} />
                )}
                {activeTab === 'settings' && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Durum</Label>
                      <Select value={form.status} onValueChange={v => upd('status', v)}>
                        <SelectTrigger className="w-full bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Taslak</SelectItem>
                          <SelectItem value="published">Yayında</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Kategori</Label>
                      <Select value={form.category} onValueChange={v => upd('category', v)}>
                        <SelectTrigger className="w-full bg-slate-50">
                          <SelectValue placeholder="Kategori Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {blogCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">URL Bağlantısı (Slug)</Label>
                      <Input value={form.slug} onChange={e => upd('slug', e.target.value)} placeholder="ornek-yazi-url" className="bg-slate-50" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Yazar Adı</Label>
                      <Input value={form.author_name} onChange={e => upd('author_name', e.target.value)} className="bg-slate-50" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Kısa Özet (Excerpt)</Label>
                      <Textarea rows={4} value={form.excerpt} onChange={e => upd('excerpt', e.target.value)} placeholder="Yazının kısa özeti..." className="resize-none bg-slate-50" />
                    </div>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Kapak Görseli</Label>
                      {form.cover_image ? (
                        <div className="space-y-3">
                          <img src={resolveImageUrl(form.cover_image)} alt="kapak" className="w-full aspect-[4/3] object-cover rounded-xl shadow-sm border border-slate-200" />
                          <Button variant="outline" size="sm" onClick={() => upd('cover_image', '')} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Görseli Kaldır</Button>
                        </div>
                      ) : (
                        <label className="block border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl p-8 text-center cursor-pointer transition-colors group">
                          <input type="file" accept="image/*" onChange={onUploadCover} className="hidden" />
                          <ImageIcon className="w-8 h-8 mx-auto text-slate-300 group-hover:text-emerald-500 mb-3 transition-colors" />
                          <div className="text-sm text-slate-600 font-medium group-hover:text-emerald-700">Görsel Yükle</div>
                          <div className="text-[10px] text-slate-400 mt-1">Önerilen boyut: 1200x800px</div>
                        </label>
                      )}
                    </div>
                    
                    <div className="border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider m-0">Arama Motoru (SEO)</Label>
                        <Button onClick={runAISEO} disabled={aiLoading} size="sm" variant="ghost" className="h-7 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full px-3">
                          {aiLoading ? <Sparkles className="w-3 h-3 mr-1.5 animate-pulse" /> : <Wand2 className="w-3 h-3 mr-1.5" />} AI Öner
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-[11px] mb-1.5 block text-slate-600">Meta Başlık</Label>
                          <Input value={form.meta_title} onChange={e => upd('meta_title', e.target.value)} className="bg-slate-50 h-9" />
                          <div className="text-[9px] font-medium text-slate-400 mt-1.5 text-right">{form.meta_title.length}/60</div>
                        </div>
                        <div>
                          <Label className="text-[11px] mb-1.5 block text-slate-600">Meta Açıklama</Label>
                          <Textarea rows={4} value={form.meta_description} onChange={e => upd('meta_description', e.target.value)} className="resize-none text-sm bg-slate-50" />
                          <div className="text-[9px] font-medium text-slate-400 mt-1.5 text-right">{form.meta_description.length}/160</div>
                        </div>
                        <div>
                          <Label className="text-[11px] mb-1.5 block text-slate-600">Etiketler</Label>
                          <Input value={form.tags.join(', ')} onChange={e => upd('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="kaktüs, bakım, toprağı..." className="bg-slate-50 h-9" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="bg-indigo-50/80 rounded-[12px] p-5 border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-800 font-bold mb-2">
                        <Brain className="w-5 h-5" /> RAG Destekli Makale
                      </div>
                      <p className="text-[11px] text-indigo-700/80 mb-5 leading-relaxed">
                        Sitenize yüklediğiniz ürünleri ve diğer içerikleri tarayarak otomatik olarak <strong>uzman tavsiyeli</strong> bir makale üretir. (Başlığa göre üretir)
                      </p>
                      <Button onClick={handleRagGenerate} disabled={aiLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg">
                        {aiLoading ? 'Üretiliyor...' : 'Otomatik Yazı Üret'}
                      </Button>
                    </div>

                    <div className="pt-2">
                      <AIResearchPanel 
                        topic={form.title} 
                        editorContent={JSON.stringify(form._content)} 
                        onInsertLink={(link) => {
                          if (editorRef.current) {
                            editorRef.current.update(() => {
                              const linkNode = $createLinkNode(link.target_url);
                              linkNode.append($createTextNode(link.anchor_text));
                              const selection = $getSelection();
                              if (selection) {
                                $insertNodes([linkNode]);
                              } else {
                                const p = $createParagraphNode();
                                p.append(linkNode);
                                $getRoot().append(p);
                              }
                            });
                            toast.success(`Link eklendi.`);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div>
                    <p className="text-[11px] leading-relaxed text-slate-500 mb-5">Bu yazıda bahsettiğiniz ürünleri buradan ekleyebilirsiniz. Okuyuculara makale içinde veya sonunda gösterilir.</p>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={productSearch}
                        onChange={async (e) => {
                          const v = e.target.value;
                          setProductSearch(v);
                          if (v.length < 2) { setProductResults([]); return; }
                          try {
                            const r = await api.get('/admin/products/search', { params: { q: v, limit: 10 } });
                            setProductResults(r.data.items);
                          } catch {}
                        }}
                        placeholder="Ürün ara..."
                        className="pl-9 bg-slate-50"
                      />
                    </div>
                    {productResults.length > 0 && (
                      <div className="mt-2 max-h-60 overflow-y-auto border border-slate-200 rounded-xl shadow-lg absolute z-20 w-[300px] bg-white">
                        {productResults.map(p => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              if (form.related_product_ids.includes(p.id)) return;
                              setForm(f => ({ ...f, related_product_ids: [...(f.related_product_ids || []), p.id] }));
                              setRelatedProducts(prev => [...prev, p]);
                              setProductSearch(''); setProductResults([]);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0 flex items-center justify-between group transition-colors"
                          >
                            <span className="font-medium text-slate-700">{p.common_name_tr}</span>
                            <span className="text-emerald-600 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase">+ Ekle</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {relatedProducts.length > 0 && (
                      <div className="mt-8 space-y-2.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Seçilen Ürünler</div>
                        {relatedProducts.map(p => (
                          <div key={p.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2 shadow-sm group">
                            {p.images && p.images[0] ? (
                              <img src={resolveImageUrl(p.images[0].thumb || p.images[0].main)} alt={p.common_name_tr} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-700 truncate">{p.common_name_tr}</div>
                            </div>
                            <button 
                              onClick={() => {
                                setForm(f => ({ ...f, related_product_ids: f.related_product_ids.filter(id => id !== p.id) }));
                                setRelatedProducts(prev => prev.filter(x => x.id !== p.id));
                              }}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
             if (e.target.tagName === 'MAIN') setActiveTab(null);
          }}
        >
          <div className="max-w-6xl mx-auto py-16 px-8 lg:px-16 min-h-full">
             <input 
               value={form.title} 
               onChange={e => upd('title', e.target.value)} 
               placeholder="Başlık Ekleyin" 
               className="w-full text-4xl sm:text-5xl lg:text-[54px] font-bold font-heading text-slate-900 placeholder-slate-200 border-none outline-none mb-10 bg-transparent leading-tight"
             />
             <div className="editor-clean-wrapper">
               <LexicalEditor 
                 content={form._content} 
                 onChange={json => upd('_content', json)}
                 onEditorReady={(editor) => { editorRef.current = editor; }}
                 onUploadImage={async (file) => {
                   const fd = new FormData();
                   fd.append('file', file);
                   const r = await api.post('/admin/blog/upload-image', fd);
                   return resolveImageUrl(r.data.url);
                 }}
               />
             </div>
             
             <div className="mt-24 text-center opacity-40 select-none pointer-events-none pb-20">
                <Sparkles className="w-6 h-6 mx-auto mb-3 text-emerald-600" />
                <p className="text-sm font-medium text-slate-600">Yapay zeka asistanı için boş bir satırda "/" tuşuna basın.</p>
             </div>
          </div>
        </main>

      </div>
    </div>
  );
}

function slugify(s) {
  return s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

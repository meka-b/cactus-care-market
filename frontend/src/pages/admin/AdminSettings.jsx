import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus, Trash2, Eye, EyeOff, KeyRound, Settings2, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';

const KEY_LABELS = {
  plantnet: 'PlantNet API Key (Bitki Tanıma)',
  mistral: 'Mistral AI API Key (RAG & Metin Üretimi)',
  exa: 'Exa API Key (Semantik Arama & SEO)',
  iyzico_api: 'İyzico API Key (Ödeme)',
  iyzico_secret: 'İyzico Secret Key',
  resend: 'Resend API Key (E-posta Gönderimi)',
  ga_id: 'Google Analytics ID',
};

function GeneralTab({ s, reload }) {
  const [form, setForm] = useState(s.general || {});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(s.general || {}); }, [s]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings/general', {
        ...form,
        free_shipping_threshold: parseFloat(form.free_shipping_threshold) || 0,
        shipping_fee: parseFloat(form.shipping_fee) || 0,
      });
      toast.success('Genel ayarlar başarıyla kaydedildi'); 
      reload();
    } catch (e) { 
      toast.error('Kaydedilemedi'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <Card className="p-8 bg-white border-none shadow-sm rounded-2xl space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-800">Mağaza Genel Ayarları</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-gray-600 font-medium">Site İsmi</Label>
          <Input className="rounded-xl border-gray-200 focus:ring-emerald-500" value={form.site_name || ''} onChange={e => upd('site_name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-600 font-medium">İletişim E-postası</Label>
          <Input className="rounded-xl border-gray-200 focus:ring-emerald-500" type="email" value={form.contact_email || ''} onChange={e => upd('contact_email', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-600 font-medium">Ücretsiz Kargo Eşiği (₺)</Label>
          <Input className="rounded-xl border-gray-200 focus:ring-emerald-500" type="number" step="0.01" value={form.free_shipping_threshold || 0} onChange={e => upd('free_shipping_threshold', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-600 font-medium">Kargo Ücreti (₺)</Label>
          <Input className="rounded-xl border-gray-200 focus:ring-emerald-500" type="number" step="0.01" value={form.shipping_fee || 0} onChange={e => upd('shipping_fee', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button onClick={save} disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl px-6 py-5 shadow-md hover:shadow-lg transition-all">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>
    </Card>
  );
}

function APIKeysTab({ s, reload }) {
  const [values, setValues] = useState({});
  const [show, setShow] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const filtered = Object.fromEntries(Object.entries(values).filter(([k, v]) => v && v.trim()));
    if (!Object.keys(filtered).length) { toast.info('Lütfen önce bir anahtar değeri girin'); return; }
    setSaving(true);
    try { 
      await api.patch('/admin/settings/api-keys', filtered); 
      toast.success('API Anahtarları başarıyla güncellendi'); 
      setValues({}); // Clear inputs after saving
      reload(); // Refresh data to show masked keys
    }
    catch (e) { toast.error('Kaydedilemedi'); } finally { setSaving(false); }
  };

  const getMaskedValue = (key) => {
    const val = s.api_keys?.[key];
    if (!val) return null;
    if (val.length <= 8) return '••••••••';
    return `••••••••${val.slice(-4)}`;
  };

  return (
    <Card className="p-8 bg-white border-none shadow-sm rounded-2xl space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-800">Entegrasyon Anahtarları</h3>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl">
          Sistem entegrasyonları için gerekli API anahtarları. Değiştirmek istemediğiniz alanları boş bırakın. Güvenliğiniz için kayıtlı anahtarlar maskelenmiş olarak gösterilir.
        </p>
      </div>

      <div className="space-y-5">
        {Object.entries(KEY_LABELS).map(([key, label]) => {
          const maskedVal = getMaskedValue(key);
          const hasKey = !!maskedVal;

          return (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="w-full sm:w-[250px] flex-shrink-0">
                <Label className="font-semibold text-gray-700">{label}</Label>
                <div className="mt-1">
                  {hasKey ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Aktif: {maskedVal}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Tanımlanmamış
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 flex gap-3">
                <div className="relative flex-1">
                  <Input
                    className="rounded-xl border-gray-200 focus:ring-indigo-500 pr-10"
                    type={show[key] ? 'text' : 'password'}
                    placeholder={hasKey ? "Yeni anahtarla güncelle..." : "API anahtarını girin..."}
                    value={values[key] || ''}
                    onChange={e => setValues({ ...values, [key]: e.target.value })}
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShow({ ...show, [key]: !show[key] })}
                  >
                    {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={save} disabled={saving} className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-6 py-5 shadow-md hover:shadow-lg transition-all">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Güncelleniyor...' : 'Anahtarları Kaydet'}
        </Button>
      </div>
    </Card>
  );
}

function MenuTab({ s, reload }) {
  const [links, setLinks] = useState(s.menu?.header_links || []);
  const [landing, setLanding] = useState(s.menu?.landing_visibility || {});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setLinks(s.menu?.header_links || []); setLanding(s.menu?.landing_visibility || {}); }, [s]);

  const addLink = () => setLinks([...links, { label: 'Yeni Link', url: '/', order: (links.at(-1)?.order || 0) + 1, visible: true }]);
  const updLink = (i, k, v) => setLinks(links.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const delLink = (i) => setLinks(links.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      const sorted = [...links].sort((a, b) => (a.order || 0) - (b.order || 0));
      await api.patch('/admin/settings/menu', { header_links: sorted, landing_visibility: landing });
      toast.success('Menü ayarları başarıyla kaydedildi'); 
      reload();
    } catch { toast.error('Kaydedilemedi'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">Üst Menü Navigasyonu</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">Sitenin üst kısmında yer alacak yönlendirme linklerini düzenleyin.</p>
          </div>
          <Button onClick={addLink} className="bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />Yeni Link Ekle
          </Button>
        </div>
        
        <div className="space-y-3">
          {links.map((l, i) => (
            <div key={i} className="flex flex-wrap md:flex-nowrap gap-3 items-center p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
              <div className="flex-1 min-w-[150px]">
                <Input className="rounded-lg border-gray-200 focus:ring-orange-500" value={l.label} onChange={e => updLink(i, 'label', e.target.value)} placeholder="Bağlantı Adı" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <Input className="rounded-lg border-gray-200 focus:ring-orange-500" value={l.url} onChange={e => updLink(i, 'url', e.target.value)} placeholder="/url-adresi" />
              </div>
              <div className="w-[80px]">
                <Input className="rounded-lg border-gray-200 focus:ring-orange-500 text-center" type="number" value={l.order} onChange={e => updLink(i, 'order', parseInt(e.target.value) || 0)} placeholder="Sıra" title="Sıralama (Küçükten büyüğe)" />
              </div>
              <label className="flex items-center gap-2 text-sm w-[90px] cursor-pointer">
                <Checkbox checked={l.visible} onCheckedChange={v => updLink(i, 'visible', !!v)} />
                <span className="select-none text-gray-700">Aktif</span>
              </label>
              <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => delLink(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {links.length === 0 && <div className="text-center p-6 text-gray-400 border border-dashed rounded-xl">Henüz bir link eklenmemiş</div>}
        </div>
      </Card>

      <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">SEO Katmanları & Kategoriler</h3>
        <p className="text-sm text-gray-500 mb-6">Hangi kategori ve filtre sayfalarının sitemap (site haritası) üzerinde görünür olacağını yönetin.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(landing).sort().map(([slug, vis]) => (
            <label key={slug} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
              <Checkbox checked={!!vis} onCheckedChange={v => setLanding({ ...landing, [slug]: !!v })} />
              <span className="truncate text-sm font-medium text-gray-700">{slug}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving} className="bg-orange-600 text-white hover:bg-orange-700 rounded-xl px-6 py-5 shadow-md hover:shadow-lg transition-all">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Tüm Menü Ayarlarını Kaydet'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  useSEO({ title: 'Sistem Ayarları | Admin' });

  const load = () => api.get('/admin/settings').then(r => { setS(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  if (loading || !s) return (
    <div className="max-w-4xl space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="h-[400px] bg-gray-100 rounded-2xl"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Sistem Ayarları</h1>
        <p className="text-gray-500">Mağazanızın temel yapılandırmalarını, API entegrasyonlarını ve vitrin menülerini yönetin.</p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-gray-100/80 p-1 rounded-xl mb-6 inline-flex border border-gray-200/50">
          <TabsTrigger value="general" className="rounded-lg px-6 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all">
            Genel Ayarlar
          </TabsTrigger>
          <TabsTrigger value="api" className="rounded-lg px-6 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all">
            API Entegrasyonları
          </TabsTrigger>
          <TabsTrigger value="menu" className="rounded-lg px-6 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm transition-all">
            Menü & SEO Navigasyonu
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-2">
          <TabsContent value="general" className="focus:outline-none">
            <GeneralTab s={s} reload={load} />
          </TabsContent>
          <TabsContent value="api" className="focus:outline-none">
            <APIKeysTab s={s} reload={load} />
          </TabsContent>
          <TabsContent value="menu" className="focus:outline-none">
            <MenuTab s={s} reload={load} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

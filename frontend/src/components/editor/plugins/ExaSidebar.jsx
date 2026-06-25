import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Send, Type, PlusCircle } from 'lucide-react';
import { api } from '../../../lib/api';

const TABS = [
  { id: 'fetch', label: 'URL Çek' },
  { id: 'page', label: 'Sayfa Üret' },
  { id: 'social', label: 'Sosyal Medya' },
  { id: 'ad', label: 'Reklam' }
];

export default function ExaSidebar({ onInsert }) {
  const [activeTab, setActiveTab] = useState('fetch');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Form states
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [variant, setVariant] = useState('');

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    let endpoint = '';
    let payload = {};

    try {
      if (activeTab === 'fetch') {
        if (!url) throw new Error('URL gerekli');
        endpoint = '/admin/exa/fetch-url';
        payload = { url, query: topic }; // topic is used as optional query here
      } else if (activeTab === 'page') {
        if (!topic) throw new Error('Konu gerekli');
        endpoint = '/admin/exa/generate-page';
        payload = { topic, variant: variant || 'Listicle' };
      } else if (activeTab === 'social') {
        if (!topic) throw new Error('Konu gerekli');
        endpoint = '/admin/exa/generate-social';
        payload = { topic, variant: variant || 'LinkedIn' };
      } else if (activeTab === 'ad') {
        if (!topic) throw new Error('Konu gerekli');
        endpoint = '/admin/exa/generate-ad';
        payload = { topic, variant: variant || 'LinkedIn Sponsored' };
      }

      const response = await api.post(endpoint, payload);
      const res = response.data;

      if (!res.success) {
        throw new Error(res.detail || 'Bir hata oluştu');
      }

      // Backend returns { content_tr: ... , citations: ... }
      setResult(res.data);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const insertToEditor = () => {
    if (!result || !result.content_tr) return;

    let textToInsert = '';
    if (typeof result.content_tr === 'string') {
      textToInsert = result.content_tr;
      // If the text contains a markdown JSON block, let's extract and format it
      const jsonMatch = textToInsert.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          // Convert the JSON to a readable text format
          let formattedText = '';
          if (parsed.baslik) formattedText += `${parsed.baslik}\n\n`;
          if (parsed.icerik) {
            const traverse = (obj) => {
              for (const key in obj) {
                if (typeof obj[key] === 'string') {
                  formattedText += `${obj[key]}\n\n`;
                } else if (typeof obj[key] === 'object') {
                  traverse(obj[key]);
                }
              }
            };
            traverse(parsed.icerik);
          }
          if (formattedText) {
            textToInsert = formattedText.trim();
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    } else {
      try {
        textToInsert = JSON.stringify(result.content_tr, null, 2);
      } catch (e) {
        textToInsert = String(result.content_tr);
      }
    }

    if (onInsert) {
      onInsert(textToInsert);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Exa AI Asistan
        </div>
        <p className="text-xs text-slate-500 mt-1">İnterneti tarayın, içerik üretin ve çevirin.</p>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide bg-white shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); setError(null); }}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {activeTab === 'fetch' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kaynak URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Odak (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Sadece belli bir konu..."
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
            </>
          )}

          {activeTab === 'page' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Konu / Anahtar Kelime</label>
                <input
                  type="text"
                  placeholder="Örn: 2024'ün en iyi SEO araçları"
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Format</label>
                <select
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={variant}
                  onChange={e => setVariant(e.target.value)}
                >
                  <option value="">Seçiniz (Varsayılan: Listicle)</option>
                  <option value="Listicle">Listicle (Liste)</option>
                  <option value="Comparison">Comparison (Karşılaştırma)</option>
                  <option value="Alternatives">Alternatives (Alternatifler)</option>
                  <option value="FAQ">FAQ (Sıkça Sorulan Sorular)</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'social' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Konu</label>
                <input
                  type="text"
                  placeholder="Örn: AI yazılım araçları tartışması"
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Platform / Format</label>
                <select
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={variant}
                  onChange={e => setVariant(e.target.value)}
                >
                  <option value="">Seçiniz (Varsayılan: LinkedIn)</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Tweet">Tweet</option>
                  <option value="Thread">Twitter Thread</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'ad' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ürün / Hedef</label>
                <input
                  type="text"
                  placeholder="Örn: B2B SaaS CFO'ları için gelir tahmini"
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Platform</label>
                <select
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  value={variant}
                  onChange={e => setVariant(e.target.value)}
                >
                  <option value="">Seçiniz (Varsayılan: LinkedIn Sponsored)</option>
                  <option value="Google">Google Search</option>
                  <option value="Meta">Meta (Facebook/Instagram)</option>
                  <option value="LinkedIn Sponsored">LinkedIn Sponsored</option>
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleAction}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'İşleniyor...' : 'Ara ve Üret'}
          </button>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Sonuç</span>
                <button
                  onClick={insertToEditor}
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-medium flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" /> Editöre Ekle
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-md p-3 text-xs text-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                {typeof result.content_tr === 'string' ? result.content_tr : JSON.stringify(result.content_tr, null, 2)}
              </div>
              {result.citations && result.citations.length > 0 && (
                <div className="mt-3">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Kaynaklar</span>
                  <ul className="mt-1 space-y-1">
                    {result.citations.map((c, i) => (
                      <li key={i} className="text-[10px] text-slate-600 truncate">
                        <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-emerald-600 hover:underline">
                          {c.title || c.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

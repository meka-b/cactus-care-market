import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Search, CheckCircle2, Circle, Link as LinkIcon, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function AIResearchPanel({ topic, editorContent, onInsertLink }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [linksLoading, setLinksLoading] = useState(false)
  const [linkSuggestions, setLinkSuggestions] = useState(null)

  const handleAnalyze = async () => {
    if (!topic || topic.trim().length < 3) {
      toast.error('Lütfen analiz için geçerli bir blog başlığı girin.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/seo/analyze-topic', { topic })
      setData(res.data)
      toast.success('Exa analizi tamamlandı!')
    } catch (err) {
      console.error(err)
      toast.error('Analiz sırasında bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to check if entity exists in the editor content
  const isEntityUsed = (entity) => {
    if (!editorContent) return false
    const regex = new RegExp(entity, 'i')
    return regex.test(editorContent)
  }

  const handleSuggestLinks = async () => {
    if (!editorContent || editorContent.length < 50) {
      toast.error('İçerik çok kısa. Lütfen biraz daha metin yazın.')
      return
    }
    setLinksLoading(true)
    try {
      const res = await api.post('/seo/suggest-links', { text: editorContent })
      setLinkSuggestions(res.data.suggestions || [])
      toast.success('İç link önerileri hazır!')
    } catch (err) {
      console.error(err)
      toast.error('Link önerileri alınırken hata oluştu.')
    } finally {
      setLinksLoading(false)
    }
  }

  return (
    <div className="bg-emerald-50/80 rounded-xl p-5 border border-emerald-100 shadow-sm flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
          <Search className="w-5 h-5" /> Araştırma & Linkler
        </div>
        <p className="text-[11px] text-emerald-700/80 leading-relaxed mb-4">
          Blog başlığınıza göre rakipleri tarar, eksik konuları bulur veya içeriğinize uygun <strong>otomatik iç link</strong> önerir.
        </p>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleAnalyze} 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl h-9 text-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {data ? 'Yeniden Analiz Et' : 'Rakip Analizi Başlat'}
          </Button>
          <Button 
            onClick={handleSuggestLinks} 
            disabled={linksLoading} 
            variant="outline"
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100 bg-emerald-50 shadow-sm rounded-xl h-9 text-xs"
          >
            {linksLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
            İç Link Öner
          </Button>
        </div>
      </div>

      {(linkSuggestions?.length > 0 || data) && (
        <div className="border-t border-emerald-200/60 pt-4 space-y-6">
          {linkSuggestions && linkSuggestions.length > 0 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Semantik Link Önerileri</h4>
              <div className="flex flex-col gap-2">
                {linkSuggestions.map((link, i) => (
                  <div key={i} className="text-xs bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="font-semibold text-slate-800 mb-1">"{link.anchor_text}"</div>
                    <div className="text-slate-500 mb-2 leading-relaxed text-[11px]">{link.reason}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full truncate max-w-[140px]">{link.target_url}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 px-2 rounded-xl" onClick={() => onInsertLink && onInsertLink(link)}>
                        <Plus className="w-3 h-3 mr-1" /> Uygula
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Entities */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Zorunlu SEO Kelimeleri</h4>
                <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                  {data.entities?.map((entity, i) => {
                    const used = isEntityUsed(entity)
                    return (
                      <div key={i} className={`flex items-center gap-2 text-xs p-1.5 rounded-xl transition-colors ${used ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {used ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                        <span className={used ? 'line-through opacity-70 font-medium' : ''}>{entity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* FAQs */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Rakiplerin SSS (FAQ)</h4>
                <div className="flex flex-col gap-2">
                  {data.faqs?.map((faq, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm leading-relaxed">
                      {faq}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">İçerik Fırsatları (Gaps)</h4>
                <div className="flex flex-col gap-2">
                  {data.gaps?.map((gap, i) => (
                    <div key={i} className="text-xs text-orange-800 bg-orange-50 p-2.5 rounded-xl border border-orange-100 shadow-sm leading-relaxed">
                      <Sparkles className="w-3 h-3 inline-block mr-1 text-orange-500 mb-0.5" />
                      {gap}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

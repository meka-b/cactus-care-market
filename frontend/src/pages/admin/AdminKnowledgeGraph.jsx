import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, Search, Loader2, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminKnowledgeGraph() {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gaps, setGaps] = useState(null);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [triggeringJobs, setTriggeringJobs] = useState({});

  useEffect(() => {
    loadGraph();
    loadJobs();
    
    // Poll jobs every 5 seconds to show progress
    const interval = setInterval(() => {
      loadJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await api.get('/seo/knowledge-graph');
      setGraph(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Knowledge graph verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const res = await api.get('/seo/kg-jobs');
      setJobs(res.data);
    } catch (err) {
      console.error("Jobs alınamadı:", err);
    }
  };

  const handleFindGaps = async () => {
    if (!graph || !graph.tags) return;
    const covered_topics = Object.keys(graph.tags).slice(0, 30); // Top 30 tags
    
    setGapsLoading(true);
    try {
      const res = await api.post('/seo/find-gaps', { covered_topics });
      setGaps(res.data.gaps || []);
      toast.success('Otorite haritası ve eksik konular bulundu!');
    } catch (err) {
      console.error(err);
      toast.error('İçerik boşlukları bulunurken hata oluştu.');
    } finally {
      setGapsLoading(false);
    }
  };

  const handleManualScan = async () => {
    setScanLoading(true);
    try {
      const res = await api.post('/seo/manual-scan');
      toast.success(res.data.message);
      loadJobs(); // refresh immediately
    } catch (err) {
      console.error(err);
      toast.error('Manuel tarama başlatılamadı.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleClearFailed = async () => {
    setClearLoading(true);
    try {
      const res = await api.post('/seo/clear-failed-jobs');
      toast.success(res.data.message);
      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error('Hatalar temizlenemedi.');
    } finally {
      setClearLoading(false);
    }
  };

  const handleTriggerJob = async (jobId) => {
    setTriggeringJobs(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.post(`/seo/trigger-job/${jobId}`);
      toast.success(res.data.message);
      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error('Araştırma başlatılamadı.');
    } finally {
      setTriggeringJobs(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleCancelJob = async (jobId) => {
    setTriggeringJobs(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.post(`/seo/cancel-job/${jobId}`);
      toast.success(res.data.message);
      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error('Araştırma iptal edilemedi.');
    } finally {
      setTriggeringJobs(prev => ({ ...prev, [jobId]: false }));
    }
  };

  if (loading && !graph) return <div className="shimmer h-64 rounded-xl" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <Card className="border-blue-100 shadow-sm mb-6">
        <CardHeader className="bg-blue-50/50 pb-3 border-b border-blue-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-blue-900 flex items-center gap-2">
            <Loader2 className={`w-4 h-4 ${jobs.some(j => j.status === 'pending' || j.status === 'researching') ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            Otonom Yapay Zeka Ajanı (Canlı Takip)
          </CardTitle>
          <div className="flex items-center gap-2">
            {jobs.some(j => j.status === 'failed') && (
              <Button onClick={handleClearFailed} disabled={clearLoading} size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50">
                {clearLoading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                Hataları Temizle
              </Button>
            )}
            <Button onClick={handleManualScan} disabled={scanLoading} size="sm" variant="outline" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-100">
              {scanLoading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Search className="w-3 h-3 mr-2" />}
              Eksik Ürünleri Tara
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 max-h-48 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="text-sm text-slate-500 italic flex items-center gap-2 py-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Şu anda çalışan bir araştırma görevi yok. Yeni bir bitki ürünü eklediğinizde yapay zeka araştırması otomatik başlayacak ve buradan takip edilebilecektir.
            </div>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => (
                <li key={job.id} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3 text-sm">
                    {job.status === 'idle' && <span className="w-2 h-2 rounded-full bg-slate-400" />}
                    {job.status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />}
                    {job.status === 'researching' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    {job.status === 'completed' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    {job.status === 'failed' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                    
                    <span className="text-slate-700 flex-1">
                      {job.status === 'idle' && `Beklemede - [${job.scientific_name}]`}
                      {job.status === 'pending' && `Araştırma sırasına alındı - [${job.scientific_name}]...`}
                      {job.status === 'researching' && `Derinlemesine araştırılıyor - [${job.scientific_name}] (Exa & Mistral devrede)...`}
                      {job.status === 'completed' && `Tamamlandı - [${job.scientific_name}] başarıyla bilgi ağına eklendi.`}
                      {job.status === 'failed' && `Hata - [${job.scientific_name}] araştırılamadı. (${job.error_message})`}
                    </span>

                    {job.status === 'idle' && (
                      <Button onClick={() => handleTriggerJob(job.id)} disabled={triggeringJobs[job.id]} size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3">
                        {triggeringJobs[job.id] ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                        Araştır
                      </Button>
                    )}

                    {(job.status === 'pending' || job.status === 'researching') && (
                      <Button onClick={() => handleCancelJob(job.id)} disabled={triggeringJobs[job.id]} size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 px-3">
                        {triggeringJobs[job.id] ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                        İptal
                      </Button>
                    )}

                    <span className="text-xs text-slate-400">
                      {new Date(job.updated_at).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>

                  {/* Loading Bar for researching status */}
                  {job.status === 'researching' && (
                    <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-blue-500 rounded-full animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" style={{ width: '65%' }}></div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Network className="w-6 h-6 text-emerald-600" />
          Topical Authority & Knowledge Graph
        </h1>
        <Button onClick={handleFindGaps} disabled={gapsLoading} className="bg-emerald-600 hover:bg-emerald-700">
          {gapsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Eksik Konuları Bul (Content Gaps)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kapsanan Etiketler (Semantik Varlıklar)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {graph && Object.entries(graph.tags).map(([tag, count], i) => (
                <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium flex items-center gap-2">
                  {tag}
                  <span className="bg-white text-emerald-900 text-xs px-1.5 rounded-full">{count}</span>
                </span>
              ))}
              {(!graph?.tags || Object.keys(graph.tags).length === 0) && (
                <div className="text-slate-500 text-sm">Henüz içerik (etiket) yok.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kategori Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {graph && Object.entries(graph.categories).map(([cat, count], i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium flex items-center gap-2">
                  {cat}
                  <span className="bg-slate-300 text-slate-800 text-xs px-1.5 rounded">{count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {graph && graph.taxonomies && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-50">
              <CardTitle className="text-base text-indigo-900">Familyalar ({graph.taxonomies.families.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-64 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {graph.taxonomies.families.map((f, i) => (
                  <span key={i} className="text-sm font-medium text-indigo-700">{f}</span>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-cyan-100 shadow-sm">
            <CardHeader className="bg-cyan-50/50 pb-4 border-b border-cyan-50">
              <CardTitle className="text-base text-cyan-900">Cinsler ({graph.taxonomies.genera.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-64 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {graph.taxonomies.genera.map((g, i) => (
                  <span key={i} className="text-sm font-medium text-cyan-700">{g}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="bg-emerald-50/50 pb-4 border-b border-emerald-50">
              <CardTitle className="text-base text-emerald-900">Türler ({graph.taxonomies.species.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-64 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {graph.taxonomies.species.map((s, i) => (
                  <span key={i} className="text-sm font-medium text-emerald-700 italic">{s}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-100 shadow-sm">
            <CardHeader className="bg-rose-50/50 pb-4 border-b border-rose-50">
              <CardTitle className="text-base text-rose-900">Hastalık & Zararlılar ({graph.taxonomies.diseases.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-64 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {graph.taxonomies.diseases.map((d, i) => (
                  <span key={i} className="text-sm font-medium text-rose-700">{d}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {gaps && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-8">
            <BookOpen className="w-5 h-5 text-orange-600" />
            AI Topical Authority Haritası (Eksikler)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gaps.map((gap, i) => (
              <Card key={i} className="border-orange-200 bg-orange-50/30 shadow-sm">
                <CardHeader className="pb-3 border-b border-orange-100 bg-white/50">
                  <CardTitle className="text-base text-orange-800">{gap.cluster}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {gap.missing_topics.map((topic, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

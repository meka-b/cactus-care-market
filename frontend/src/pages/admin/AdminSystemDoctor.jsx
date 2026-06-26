import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, Server, Brain, Globe, Database, Shield, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSEO } from '@/lib/seo';
import { api } from '@/lib/api';

const getIcon = (category) => {
  if (category.includes('Sistem')) return <Server className="w-5 h-5 text-blue-600" />;
  if (category.includes('AI')) return <Brain className="w-5 h-5 text-purple-600" />;
  if (category.includes('SEO')) return <Globe className="w-5 h-5 text-emerald-600" />;
  if (category.includes('Veritabanı')) return <Database className="w-5 h-5 text-indigo-600" />;
  if (category.includes('Güvenlik')) return <Shield className="w-5 h-5 text-red-600" />;
  return <Activity className="w-5 h-5 text-slate-600" />;
};

export default function AdminSystemDoctor() {
  useSEO({ title: 'Sistem Doktoru | Admin' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/admin/system-doctor/history');
      const historyData = res.data?.data || [];
      setHistory(historyData);
      if (historyData.length > 0 && !data) {
        setData(historyData[0]); // Load latest
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = async () => {
    setLoading(true);
    const id = toast.loading('Kapsamlı sistem taraması başlatıldı...');
    try {
      const res = await api.get('/admin/system-doctor/scan');
      if (res.data?.data) {
        setData(res.data.data);
      }
      toast.success('Tarama başarıyla tamamlandı.', { id });
      loadHistory();
    } catch (e) {
      toast.error('Tarama sırasında hata oluştu', { id });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sistem Doktoru</h1>
              <p className="text-slate-500 mt-1">Tüm altyapı bileşenlerini, yapay zeka servislerini ve SEO durumunu canlı analiz edin.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block mr-4">
            <p className="text-sm font-medium text-slate-500">Son Tarama</p>
            <p className="text-sm text-slate-900">{data ? new Date(data.created_at).toLocaleString('tr-TR') : 'Hiç yapılmadı'}</p>
          </div>
          <Button 
            onClick={runScan} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 px-8 py-6 rounded-2xl text-lg font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Taranıyor...' : 'Tam Tarama Başlat'}
          </Button>
        </div>
      </div>

      {!data && !loading && (
        <Card className="p-16 text-center border-dashed border-2 border-slate-200 rounded-3xl bg-slate-50/50">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Henüz Tarama Yapılmadı</h3>
          <p className="text-slate-500 mb-6">Sisteminizin sağlığını ölçmek için hemen bir tarama başlatın.</p>
          <Button onClick={runScan} variant="outline" className="rounded-xl px-6">İlk Taramayı Başlat</Button>
        </Card>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sol Kolon: Skor ve Özet */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-8 rounded-3xl bg-gradient-to-b from-white to-slate-50 border-slate-100 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400"></div>
              <h3 className="text-slate-500 font-medium mb-6">Genel Sağlık Skoru</h3>
              
              <div className="relative inline-flex items-center justify-center mb-6">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={60 * 2 * Math.PI} 
                    strokeDashoffset={60 * 2 * Math.PI * (1 - data.score / 100)}
                    className={data.score > 80 ? 'text-emerald-500' : data.score > 50 ? 'text-orange-500' : 'text-red-500'} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-bold text-slate-800">{data.score}</span>
                  <span className="text-xs font-semibold text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-sm font-medium text-slate-700">Başarılı</span></div>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">{data.passed}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50/50 border border-orange-100/50">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-slate-700">Uyarı</span></div>
                  <span className="font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-lg">{data.warnings}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                  <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-slate-700">Kritik Hata</span></div>
                  <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-lg">{data.errors}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Geçmiş Taramalar
              </h3>
              <div className="space-y-3">
                {history.slice(0, 5).map((h, i) => (
                  <button key={h.id} onClick={() => setData(h)} className={`w-full text-left p-3 rounded-xl transition-all ${data.id === h.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700">{new Date(h.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short' })}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${h.score > 80 ? 'bg-emerald-100 text-emerald-700' : h.score > 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {h.score} Puan
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleTimeString('tr-TR')}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Sağ Kolon: Detaylı Sonuçlar */}
          <div className="lg:col-span-3 space-y-6">
            {Object.entries(data.results || {}).map(([category, checks]) => (
              <Card key={category} className="p-6 rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    {getIcon(category)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{category}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {checks.map((check, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl flex items-start gap-4 transition-all hover:shadow-md ${check.status === 'success' ? 'bg-emerald-50/30 hover:bg-emerald-50 border border-emerald-100/50' : check.status === 'warning' ? 'bg-orange-50/50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="mt-0.5">
                        {check.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                        {check.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-slate-800 truncate pr-2">{check.name}</h4>
                          {check.latency > 0 && (
                            <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm shrink-0">
                              {check.latency}ms
                            </span>
                          )}
                        </div>
                        <p className={`text-sm leading-snug ${check.status === 'error' ? 'text-red-700 font-medium' : 'text-slate-600'}`}>
                          {check.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
        </div>
      )}
    </div>
  );
}

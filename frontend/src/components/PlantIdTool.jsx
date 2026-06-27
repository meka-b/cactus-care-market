import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Leaf, HeartPulse } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PlantIdTool() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB altında olmalıdır.');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
      setResult(null);
    }
  };

  const identifyPlant = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', image);
      
      const res = await api.post('/kg/identify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(res.data);
    } catch (err) {
      setError('Bitki tanınamadı. Lütfen daha net bir fotoğraf yükleyin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  return (
    <Card className="p-6 bg-white shadow-sm border-emerald-100 max-w-xl mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-heading text-emerald-900 flex items-center justify-center gap-2">
          <Camera className="w-6 h-6 text-emerald-600" />
          Yapay Zeka Bitki Tanıma
        </h2>
        <p className="text-muted-foreground text-sm mt-2">Bir bitkinin veya yaprağın fotoğrafını yükleyin, türünü ve sağlık durumunu (hastalıklarını) anında öğrenin.</p>
      </div>

      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-200 rounded-xl p-10 flex flex-col items-center justify-center text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-colors cursor-pointer"
        >
          <Upload className="w-10 h-10 mb-3 text-emerald-500" />
          <span className="font-medium">Fotoğraf Yükle veya Çek</span>
          <span className="text-xs text-emerald-600/70 mt-1">JPG, PNG (Max 5MB)</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
            <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
            <button 
              onClick={clear}
              className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {!result && !loading && (
            <Button onClick={identifyPlant} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg">
              Teşhis Et
            </Button>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-6 text-emerald-600 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="font-medium animate-pulse">Bitki inceleniyor... (Bu işlem birkaç saniye sürebilir)</span>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

          {result && (
            <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Classification Results */}
              {result.result?.classification?.suggestions?.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-2 mb-3">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                    Bitki Eşleşmeleri
                  </h3>
                  <div className="space-y-3">
                    {result.result.classification.suggestions.slice(0, 3).map((sug, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{sug.name}</div>
                          {sug.details?.common_names?.length > 0 && (
                            <div className="text-xs text-muted-foreground capitalize">{sug.details.common_names.join(', ')}</div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                          %{(sug.probability * 100).toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Assessment */}
              {result.result?.disease?.suggestions?.length > 0 && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-3">
                    <HeartPulse className="w-5 h-5 text-orange-600" />
                    Sağlık Durumu (Hastalıklar)
                  </h3>
                  <div className="space-y-3">
                    {result.result.disease.suggestions.slice(0, 3).map((dis, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                        <div className="font-semibold text-slate-800">{dis.name}</div>
                        <div className="text-sm font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          %{(dis.probability * 100).toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

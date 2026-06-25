import React from 'react';
import { Upload, X, Droplet, Sun, Wind, Move, Shovel, Thermometer, Flower, Scissors, Box, Coffee } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export const GUIDE_SECTIONS = [
  { id: 'how_it_grows', label: 'NASIL BÜYÜR?', icon: Move },
  { id: 'anatomy', label: 'ANATOMİ', icon: Box },
  { id: 'advice', label: 'TAVSİYE', icon: Wind },
  { id: 'size', label: 'NE KADAR BÜYÜR?', icon: Move },
  { id: 'water_me', label: 'BENİ SULA', icon: Droplet },
  { id: 'position_me', label: 'BENİ YERLEŞTİR', icon: Sun },
  { id: 'help_me_flower', label: 'ÇİÇEK AÇMAMA YARDIM ET', icon: Flower },
  { id: 'share_me', label: 'BENİ ÇOĞALT', icon: Scissors },
  { id: 'repot_me', label: 'SAKSIMI DEĞİŞTİR', icon: Shovel },
  { id: 'feed_me', label: 'BENİ BESLE', icon: Coffee },
];

export function AdvancedGuideEditor({ value, onChange }) {
  const handleEnableToggle = (e) => {
    onChange({ ...value, enabled: e.target.checked });
  };

  const handleTextChange = (sectionId, text) => {
    onChange({
      ...value,
      sections: {
        ...(value?.sections || {}),
        [sectionId]: { ...(value?.sections?.[sectionId] || {}), text }
      }
    });
  };

  const handleImageUpload = async (sectionId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('Görsel yükleniyor...', { id: 'guide-upload' });
      const response = await api.post('/admin/media/upload', formData);
      
      onChange({
        ...value,
        sections: {
          ...(value?.sections || {}),
          [sectionId]: { ...(value?.sections?.[sectionId] || {}), image: response.data.url }
        }
      });
      toast.success('Görsel yüklendi!', { id: 'guide-upload' });
    } catch (error) {
      toast.error('Görsel yükleme hatası', { id: 'guide-upload' });
      console.error(error);
    }
  };

  const handleRemoveImage = (sectionId) => {
    onChange({
      ...value,
      sections: {
        ...(value?.sections || {}),
        [sectionId]: { ...(value?.sections?.[sectionId] || {}), image: '' }
      }
    });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-medium">Gelişmiş Bakım Rehberi (İnfografik)</h3>
          <p className="text-sm text-slate-500">Ürün sayfasında görsel bakım rehberi göstermek için aktif edin.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={value?.enabled || false}
            onChange={handleEnableToggle}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {value?.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDE_SECTIONS.map((section) => {
            const sectionData = value?.sections?.[section.id] || { text: '', image: '' };
            const Icon = section.icon;

            return (
              <div key={section.id} className="p-4 border rounded-lg bg-slate-50 space-y-3">
                <div className="flex items-center gap-2 mb-2 font-medium text-slate-700">
                  <Icon className="w-5 h-5 text-primary" />
                  {section.label}
                </div>
                
                <textarea
                  className="w-full text-sm border-slate-200 rounded-md p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-20"
                  placeholder="Bu bölüm için açıklama girin..."
                  value={sectionData.text || ''}
                  onChange={(e) => handleTextChange(section.id, e.target.value)}
                />

                <div className="flex items-center gap-4">
                  {sectionData.image ? (
                    <div className="relative w-16 h-16 rounded-md border bg-white overflow-hidden group">
                      <img src={sectionData.image} alt={section.label} className="w-full h-full object-contain" />
                      <button 
                        onClick={() => handleRemoveImage(section.id)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-16 h-16 rounded-md border-2 border-dashed border-slate-300 hover:border-primary bg-white cursor-pointer transition-colors text-slate-400 hover:text-primary shrink-0">
                      <Upload className="w-5 h-5" />
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(section.id, e.target.files[0])}
                      />
                    </label>
                  )}
                  <div className="text-xs text-slate-500 flex-1">
                    İkon yükleyin. Yüklenmezse varsayılan ikon gösterilir.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

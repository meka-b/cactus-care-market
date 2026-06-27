import React, { useState, useEffect } from 'react';
import { REGISTRY } from '@/components/templates/TemplateRegistry';
import { useTemplates } from '@/contexts/TemplateContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { LayoutTemplate, Save, AlertCircle } from 'lucide-react';

export function AdminDesigner() {
  const { templates, updateTemplates } = useTemplates();
  const [localSettings, setLocalSettings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(templates);
  }, [templates]);

  const handleVariantChange = (compName, variantName) => {
    setLocalSettings(prev => ({ ...prev, [compName]: variantName }));
  };

  const handleRatioChange = (compName, ratio) => {
    setLocalSettings(prev => ({ ...prev, [`${compName}_imageRatio`]: ratio }));
  };

  const handleSettingChange = (compName, settingKey, value) => {
    setLocalSettings(prev => ({ ...prev, [`${compName}_${settingKey}`]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/admin/settings/templates', { templates: localSettings });
      if (res.data?.updated) {
        toast.success("Tasarım ayarları başarıyla yayınlandı.");
        updateTemplates(localSettings);
      }
    } catch (err) {
      toast.error("Kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F9FAFB] p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-tight">Tasarım Yönetimi</h1>
              <p className="text-sm text-gray-500">Mağaza bileşenlerinin tasarım varyantlarını yönetin.</p>
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors px-6 py-2.5 rounded-xl font-medium text-sm shadow-sm disabled:opacity-50"
          >
            {saving ? <AlertCircle className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </header>

        {/* Component Settings List */}
        <div className="space-y-4">
          {Object.entries(REGISTRY).map(([compName, config]) => {
            const activeVariantName = localSettings[compName] || config.default;
            const availableVariants = Object.keys(config.variants);

            return (
              <div key={compName} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                
                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{compName}</h3>
                  <p className="text-sm text-gray-500">{config.description}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                  
                  {/* Specific Settings like Image Ratio for ProductCard */}
                  {compName === 'ProductCard' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Görsel Oranı</label>
                      <select
                        value={localSettings[`${compName}_imageRatio`] || '1:1'}
                        onChange={(e) => handleRatioChange(compName, e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-full p-2.5 outline-none"
                      >
                        <option value="1:1">1:1 (Kare)</option>
                        <option value="3:4">3:4 (Dikey)</option>
                        <option value="4:5">4:5 (Dikey Uzun)</option>
                      </select>
                    </div>
                  )}

                  {/* HeaderNavbar specific settings */}
                  {compName === 'HeaderNavbar' && activeVariantName === 'Evon' && (
                    <div className="flex flex-col gap-1.5 w-24">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Oval (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={localSettings[`${compName}_evonBorderRadius`] ?? 999}
                        onChange={(e) => handleSettingChange(compName, 'evonBorderRadius', e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-full p-2.5 outline-none"
                      />
                    </div>
                  )}

                  {/* CategoryList specific settings */}
                  {compName === 'CategoryList' && activeVariantName === 'ModernCarousel' && (
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Sonsuz Kayan Yazı</label>
                      <select
                        value={localSettings[`${compName}_marqueeEnabled`] !== false ? "true" : "false"}
                        onChange={(e) => handleSettingChange(compName, 'marqueeEnabled', e.target.value === "true")}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-full p-2.5 outline-none"
                      >
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                      </select>
                    </div>
                  )}

                  {/* Variant Selection */}
                  <div className="flex flex-col gap-1.5 min-w-[180px]">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tasarım Varyantı</label>
                    <select
                      value={activeVariantName}
                      onChange={(e) => handleVariantChange(compName, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-full p-2.5 outline-none font-medium"
                    >
                      {availableVariants.map(variant => (
                        <option key={variant} value={variant}>
                          {variant} {variant === config.default ? '(Varsayılan)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

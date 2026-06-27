import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, resolveImageUrl } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Card } from '@/components/ui/card';
import { INaturalistGallery } from '@/components/INaturalistGallery';
import { Sun, Droplet, Thermometer, ShieldAlert, Activity, ArrowRight, ChevronDown, BookOpen } from 'lucide-react';

export default function SpeciesPage() {
  const { slug } = useParams();
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/kg/species/${slug}`)
      .then(res => setSpecies(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  useSEO({
    title: species ? `${species.common_names[0] || species.scientific_name} Nedir ve Bakımı Nasıl Yapılır?` : 'Bitki Türü',
    description: species ? species.description.substring(0, 160) : '',
  });

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 shimmer h-96 rounded-xl" />;
  if (!species) return <div className="max-w-6xl mx-auto px-4 py-8 text-center">Tür bulunamadı.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <SiteBreadcrumb items={[
        { label: 'Ansiklopedi', href: '/bilgi' },
        { label: species.family_slug || 'Familya', href: `/aile/${species.family_slug}` },
        { label: species.genus_slug || 'Cins', href: `/cins/${species.genus_slug}` },
        { label: species.scientific_name }
      ]} />

      <div className="mt-8 grid lg:grid-cols-[1fr_350px] gap-8 items-start">
        {/* Left Column: Content */}
        <div className="space-y-10">
          <div>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-slate-900">
              {species.scientific_name}
            </h1>
            {species.common_names && species.common_names.length > 0 && (
              <p className="text-lg text-muted-foreground mt-2 font-medium">
                Yaygın adları: {species.common_names.join(', ')}
              </p>
            )}
          </div>

          {/* Gallery */}
          {species.images && species.images.length > 0 && (
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-sm">
              <img src={species.images[0].url} alt={species.images[0].alt} className="w-full h-full object-cover" />
              {species.images[0].source && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  Kaynak: {species.images[0].source}
                </div>
              )}
            </div>
          )}

          {/* Identity Card */}
          <Card className="overflow-hidden border-emerald-100 shadow-sm mt-8">
            <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100">
              <h3 className="font-heading font-semibold text-emerald-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Bitki Kimlik Kartı
              </h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-[150px_1fr] border-b pb-3">
                <span className="text-muted-foreground">Latince Adı</span>
                <span className="font-medium text-left italic">{species.scientific_name}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr] border-b pb-3">
                <span className="text-muted-foreground">Familya</span>
                <span className="font-medium text-left capitalize">{species.family_slug?.replace(/-/g, ' ')}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr] border-b pb-3">
                <span className="text-muted-foreground">Cins</span>
                <span className="font-medium text-left capitalize">{species.genus_slug?.replace(/-/g, ' ')}</span>
              </div>
              
              <div className="grid grid-cols-[150px_1fr] border-b pb-3">
                <span className="text-muted-foreground flex items-center gap-1"><Sun className="w-3.5 h-3.5" /> Işık</span>
                <span className="font-medium text-left">{species.care_guide?.light || '-'}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr] border-b pb-3">
                <span className="text-muted-foreground flex items-center gap-1"><Droplet className="w-3.5 h-3.5" /> Sulama</span>
                <span className="font-medium text-left">{species.care_guide?.water || '-'}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr] border-b pb-3">
                <span className="text-muted-foreground flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Sıcaklık</span>
                <span className="font-medium text-left">{species.care_guide?.temperature || '-'}</span>
              </div>
              <div className="grid grid-cols-[150px_1fr]">
                <span className="text-muted-foreground flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Zehirlilik</span>
                <span className="font-medium text-left text-orange-600">{species.care_guide?.toxicity || '-'}</span>
              </div>
            </div>
          </Card>

          {/* Description */}
          <div className="prose max-w-none text-slate-700 leading-relaxed">
            <h2 className="text-2xl font-heading font-semibold text-slate-900 border-b pb-2 mb-4">Genel Bilgi</h2>
            <p>{species.description}</p>

            {species.etymology && (
              <>
                <h3 className="text-xl font-heading font-semibold text-slate-900 mt-8 mb-3">Etimoloji (İsmin Kökeni)</h3>
                <p>{species.etymology}</p>
              </>
            )}
          </div>

          {/* Diseases */}
          {species.diseases && species.diseases.length > 0 && (
            <div>
              <h2 className="text-2xl font-heading font-semibold text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-orange-500" />
                Yaygın Hastalıklar ve Zararlılar
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {species.diseases.map(disease => (
                  <Link key={disease.slug} to={`/hastalik/${disease.slug}`} className="block group">
                    <Card className="p-4 bg-orange-50/50 border-orange-100 hover:border-orange-300 transition-colors">
                      <div className="font-semibold text-orange-900 flex items-center justify-between">
                        {disease.name}
                        <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {species.faqs && species.faqs.length > 0 && (
            <div>
              <h2 className="text-2xl font-heading font-semibold text-slate-900 border-b pb-2 mb-6">Sıkça Sorulan Sorular</h2>
              <div className="space-y-4">
                {species.faqs.map((faq, idx) => (
                  <details key={idx} className="group bg-slate-50 border rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer p-4 font-semibold text-slate-800">
                      {faq.question}
                      <ChevronDown className="w-5 h-5 text-slate-400 group-open:-rotate-180 transition-transform" />
                    </summary>
                    <div className="p-4 pt-0 text-slate-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* iNaturalist Gallery */}
          <INaturalistGallery scientificName={species.scientific_name} />
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-20">

          {/* Related Products CTA */}
          {species.products && species.products.length > 0 && (
            <Card className="p-5 border-primary bg-gradient-to-br from-emerald-50 to-white shadow-sm">
              <h3 className="font-heading font-semibold text-lg mb-2">Bu türü satın almak ister misiniz?</h3>
              <p className="text-sm text-muted-foreground mb-4">Seramızda yetişen özel {species.scientific_name} varyetelerini inceleyin.</p>
              <div className="space-y-3">
                {species.products.map(prod => (
                  <Link key={prod.id} to={`/u/${prod.slug}`} className="flex items-center gap-3 group p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-emerald-100">
                    <img src={resolveImageUrl(prod.images[0]?.thumb)} alt={prod.common_name_tr} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-primary">{prod.common_name_tr}</div>
                      <div className="text-sm font-bold text-primary">{prod.price} TL</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

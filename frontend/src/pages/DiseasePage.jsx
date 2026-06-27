import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Card } from '@/components/ui/card';
import { ShieldAlert, Info, List, Stethoscope, ArrowRight, BookOpen } from 'lucide-react';

export default function DiseasePage() {
  const { slug } = useParams();
  const [disease, setDisease] = useState(null);
  const [otherDiseases, setOtherDiseases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/kg/diseases/${slug}`),
      api.get(`/kg/diseases`)
    ]).then(([resDisease, resAll]) => {
      setDisease(resDisease.data);
      setOtherDiseases(resAll.data.filter(d => d.slug !== slug).slice(0, 5));
    }).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  useSEO({ title: disease ? `${disease.name} Hastalığı ve Tedavisi` : 'Hastalık Merkezi' });

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 shimmer h-96 rounded-xl" />;
  if (!disease) return <div className="p-8 text-center">Hastalık bulunamadı.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SiteBreadcrumb items={[{ label: 'Hastalık Merkezi', href: '/hastaliklar' }, { label: disease.name }]} />
      
      <div className="mt-8 flex items-center gap-4 border-b pb-6">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 flex items-center justify-center rounded-xl shrink-0">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900">{disease.name}</h1>
          <p className="text-slate-500 font-medium mt-1">Bitki Hastalıkları ve Zararlıları Rehberi</p>
        </div>
      </div>
      
      <div className="mt-8 grid lg:grid-cols-[1fr_350px] gap-10 items-start">
        {/* Left Column: Content */}
        <div className="prose max-w-none text-slate-700 leading-relaxed space-y-10">
          
          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Info className="w-6 h-6 text-emerald-600" />
              Hastalık Hakkında
            </h2>
            <p className="text-lg">{disease.description}</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900 flex items-center gap-2 mb-4 border-t pt-8">
              <List className="w-6 h-6 text-red-500" />
              Belirtiler (Semptomlar)
            </h2>
            <ul className="space-y-3 mt-4 bg-red-50/50 p-6 rounded-xl border border-red-100 list-none ml-0">
              {disease.symptoms?.map((sym, i) => (
                <li key={i} className="flex items-start gap-3 m-0">
                  <span className="w-2 h-2 rounded-full bg-red-400 mt-2.5 shrink-0" />
                  <span>{sym}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900 flex items-center gap-2 mb-4 border-t pt-8">
              <Stethoscope className="w-6 h-6 text-blue-500" />
              Tedavi Yöntemleri
            </h2>
            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
              <p className="m-0 text-slate-800">{disease.treatment}</p>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8 lg:sticky lg:top-20">
          
          {/* Affected Species */}
          {disease.affected_species_slugs && disease.affected_species_slugs.length > 0 && (
            <Card className="border-emerald-100 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100">
                <h3 className="font-heading font-semibold text-emerald-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Bu Hastalığa Yatkın Türler
                </h3>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {disease.affected_species_slugs.map(sp => (
                  <Link key={sp} to={`/tur/${sp}`} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
                    <span className="font-medium text-slate-700 capitalize">{sp.replace(/-/g, ' ')}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Other Diseases */}
          {otherDiseases.length > 0 && (
            <Card className="border-orange-100 shadow-sm overflow-hidden">
              <div className="bg-orange-50 px-5 py-4 border-b border-orange-100">
                <h3 className="font-heading font-semibold text-orange-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Diğer Hastalıklar
                </h3>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {otherDiseases.map(d => (
                  <Link key={d.id} to={`/hastalik/${d.slug}`} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-colors">
                    <span className="font-medium text-slate-700 capitalize">{d.name}</span>
                    <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
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

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Card } from '@/components/ui/card';
import { ArrowRight, BookOpen, Leaf } from 'lucide-react';

export default function FamilyPage() {
  const { slug } = useParams();
  const [family, setFamily] = useState(null);

  useEffect(() => {
    api.get(`/kg/families/${slug}`).then(res => setFamily(res.data)).catch(console.error);
  }, [slug]);

  useSEO({ title: family ? `${family.name} Familyası Özellikleri` : 'Familya' });

  if (!family) return <div className="p-8">Yükleniyor...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <SiteBreadcrumb items={[{ label: 'Ansiklopedi', href: '/bilgi' }, { label: family.name }]} />
      
      <div className="mt-8 flex items-center gap-4 border-b pb-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-2xl shrink-0">
          <Leaf className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900">{family.name}</h1>
          <p className="text-slate-500 font-medium mt-1">Bitki Familyası</p>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_350px] gap-10 items-start">
        {/* Left Column: Content */}
        <div className="space-y-10">
          <section className="prose max-w-none text-slate-700 leading-relaxed text-lg">
            <p>{family.description}</p>
          </section>

          {family.genuses && family.genuses.length > 0 && (
            <section>
              <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Bu Familyadaki Cinsler</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {family.genuses.map(genus => (
                  <Link key={genus.slug} to={`/cins/${genus.slug}`} className="group">
                    <Card className="p-4 hover:shadow-md transition-shadow border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">{genus.name}</h3>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-6">
          <Card className="p-6 bg-slate-50/50 border-slate-200 shadow-sm rounded-2xl">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Familya Özeti
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Bilimsel Ad:</span>
                <span>{family.name}</span>
              </li>
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Cins Sayısı:</span>
                <span>{family.genuses?.length || 0}</span>
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

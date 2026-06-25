import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BookOpen, Leaf, FolderTree } from 'lucide-react';

export default function EncyclopediaPage() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/kg/families')
      .then(res => setFamilies(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useSEO({
    title: 'Bitki Ansiklopedisi',
    description: 'Kaktüs ve sukulent aileleri, cinsleri ve türleri hakkında kapsamlı bilgi edinin.',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-10">
      <SiteBreadcrumb items={[{ label: 'Ansiklopedi' }]} />

      <div className="mt-6 mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
          <BookOpen className="w-8 h-8 text-emerald-600" />
          Bitki Ansiklopedisi
        </h1>
        <p className="text-slate-600">
          Tüm kaktüs ve sukulent bitki ailelerini inceleyin, bakım sırlarını ve özelliklerini öğrenin.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {families.map(family => (
            <Link key={family.slug} to={`/aile/${family.slug}`} className="block group">
              <Card className="p-6 h-full border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all bg-emerald-50/20 group-hover:bg-emerald-50/50 flex flex-col items-center justify-center text-center">
                <FolderTree className="w-10 h-10 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                <h2 className="text-xl font-heading font-semibold text-slate-800">{family.name}</h2>
                <span className="mt-2 text-sm text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Aile Rehberini İncele →
                </span>
              </Card>
            </Link>
          ))}
          {families.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-20" />
              Henüz aile kaydı bulunmuyor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

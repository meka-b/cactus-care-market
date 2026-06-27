import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Library, ArrowRight } from 'lucide-react';

export default function CollectionListPage() {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/kg/genuses')
      .then(res => setSpecies(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useSEO({
    title: 'Özel Koleksiyonlar',
    description: 'Farklı türlere ait nadir ve özel koleksiyonlarımızı keşfedin.',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-10">
      <SiteBreadcrumb items={[{ label: 'Koleksiyon' }]} />

      <div className="mt-6 mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
          <Library className="w-8 h-8 text-emerald-600" />
          Tüm Koleksiyonlar
        </h1>
        <p className="text-slate-600">
          İlginizi çeken cinslerin tüm ürünlerini, bitkilerini ve saksılarını bir arada görün.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {species.map(sp => (
            <Link key={sp.slug} to={`/koleksiyon/${sp.slug}`} className="block group">
              <Card className="p-5 h-full border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-slate-800 capitalize">{sp.name}</h2>
                  <p className="text-xs text-slate-500 mt-1 italic">{sp.family_slug}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>
          ))}
          {species.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              Henüz koleksiyon kaydı bulunmuyor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

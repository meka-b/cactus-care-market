import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function DiseaseListPage() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/kg/diseases')
      .then(res => setDiseases(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useSEO({
    title: 'Hastalık Merkezi',
    description: 'Yaygın bitki hastalıkları, belirtileri ve tedavi yöntemleri hakkında bilgi alın.',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-10">
      <SiteBreadcrumb items={[{ label: 'Hastalık Merkezi' }]} />

      <div className="mt-6 mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
          <ShieldAlert className="w-8 h-8 text-orange-500" />
          Hastalık Merkezi
        </h1>
        <p className="text-slate-600">
          Bitkilerinizde görülen yaygın hastalıkları, zararlıları ve bunlara karşı alabileceğiniz kesin çözüm ve tedavi yöntemlerini öğrenin.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {diseases.map(disease => (
            <Link key={disease.slug} to={`/hastalik/${disease.slug}`} className="block group">
              <Card className="p-5 h-full border border-orange-100 bg-orange-50/30 hover:bg-orange-50/80 hover:border-orange-300 hover:shadow-md transition-all flex items-center justify-between">
                <h2 className="font-heading font-semibold text-orange-900">{disease.name}</h2>
                <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
              </Card>
            </Link>
          ))}
          {diseases.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              Henüz hastalık kaydı bulunmuyor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

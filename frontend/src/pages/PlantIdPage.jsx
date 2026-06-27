import React from 'react';
import { useSEO } from '@/lib/seo';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import PlantIdTool from '@/components/PlantIdTool';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ShieldAlert, BookOpen } from 'lucide-react';

export default function PlantIdPage() {
  useSEO({
    title: 'Yapay Zeka Bitki ve Hastalık Teşhisi',
    description: 'Bitkinizin fotoğrafını çekerek türünü ve hastalıklarını anında öğrenin.',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <SiteBreadcrumb items={[
        { label: 'Hastalık Merkezi & Teşhis', href: '/teshis' }
      ]} />
      
      <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Left Column: Content */}
        <div>
          <PlantIdTool />
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-6">
          <Card className="p-6 bg-slate-50 border-slate-100 shadow-sm rounded-xl">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Yaygın Hastalıklar
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Bitkilerde sıkça görülen hastalıklar ve zararlılar hakkında bilgi alın.
            </p>
            <Link to={`/hastaliklar`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
              Hastalık Rehberi <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </Card>
          
          <Card className="p-6 bg-emerald-50/50 border-emerald-100 shadow-sm rounded-xl">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Bakım Sırları
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Bitkinizi teşhis ettikten sonra doğru bakım adımlarını blog sayfamızda keşfedin.
            </p>
            <Link to={`/blog`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
              Tüm Blog Yazıları <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';
import useEmblaCarousel from 'embla-carousel-react';
import { Leaf, Sun, Droplets, Flower2, Sprout, TreePine } from 'lucide-react';

const SUB_CATEGORIES = [
  { label: 'Kaktüsler', slug: 'kaktusler', icon: Sun },
  { label: 'Sukulentler', slug: 'sukulentler', icon: Droplets },
  { label: 'Salon Bitkileri', slug: 'salon-bitkileri', icon: Leaf },
  { label: 'Büyük Boy', slug: 'buyuk-boy', icon: TreePine },
  { label: 'Çiçekli', slug: 'cicekli', icon: Flower2 },
  { label: 'Mini Boy', slug: 'mini-boy', icon: Sprout }
];

export default function ShopHeaderMinimalSubnav({ slug, data }) {
  const [emblaRef] = useEmblaCarousel({ 
    dragFree: true,
    align: 'start',
    containScroll: 'trimSnaps'
  });

  const breadcrumbItems = [
    { label: data?.h1 || slug }
  ];

  return (
    <div className="mb-8">
      <SiteBreadcrumb items={breadcrumbItems} />
      
      <div className="mt-8 mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold font-heading text-gray-900 tracking-tight">{data?.h1 || slug}</h1>
        {data?.description && <p className="text-gray-500 mt-4 text-base max-w-3xl leading-relaxed">{data.description}</p>}
      </div>

      <div className="overflow-hidden cursor-grab active:cursor-grabbing pb-4 -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
        <div className="flex space-x-3">
          {SUB_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = cat.slug === slug;
            return (
              <div key={idx} className="flex-none">
                <Link to={`/k/${cat.slug}`} className="block">
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] border transition-colors ${isActive ? 'border-gray-900 bg-gray-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                    <div className="w-8 h-8 rounded-md bg-[#F2F2F2] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-gray-700" strokeWidth={2} />
                    </div>
                    <span className={`text-sm font-semibold pr-2 ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {cat.label}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

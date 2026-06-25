import React from 'react';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';

export default function ShopHeaderDefault({ slug, data }) {
  const breadcrumbItems = [
    { label: data?.h1 || slug }
  ];

  return (
    <div className="mb-6">
      <SiteBreadcrumb items={breadcrumbItems} />
      <div className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-semibold font-heading">{data?.h1 || slug}</h1>
        {data?.description && <p className="text-muted-foreground mt-2 max-w-3xl">{data.description}</p>}
      </div>
    </div>
  );
}

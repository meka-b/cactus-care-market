import React from 'react';
import { useTemplates } from '@/contexts/TemplateContext';
import { REGISTRY } from '@/components/templates/TemplateRegistry';

export function SiteBreadcrumb({ items }) {
  const templatesContext = useTemplates() || {};
  const templates = templatesContext.templates || {};

  const activeVariantName = templates?.SiteBreadcrumb || REGISTRY.SiteBreadcrumb.default;
  const ActiveTemplate = REGISTRY.SiteBreadcrumb.variants[activeVariantName] || REGISTRY.SiteBreadcrumb.variants.Default;

  // Capitalize function to enforce Title Case for all variants
  const capitalize = (str) => {
    if (!str) return str;
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const fullItems = [
    { label: 'Anasayfa', href: '/' },
    ...(items || []).map(i => ({ ...i, label: capitalize(i.label) }))
  ];

  return (
    <div className="overflow-x-auto scrollbar-hide py-1">
      <div className="min-w-max">
        <ActiveTemplate items={fullItems} />
      </div>
    </div>
  );
}

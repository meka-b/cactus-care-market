import React from 'react';
import { useTemplates } from '@/contexts/TemplateContext';
import { REGISTRY } from '@/components/templates/TemplateRegistry';

export function ShopHeader({ slug, data }) {
  const templatesContext = useTemplates() || {};
  const templates = templatesContext.templates || {};

  const activeVariantName = templates?.ShopHeader || REGISTRY.ShopHeader.default;
  const ActiveTemplate = REGISTRY.ShopHeader.variants[activeVariantName] || REGISTRY.ShopHeader.variants.Default;

  return <ActiveTemplate slug={slug} data={data} />;
}

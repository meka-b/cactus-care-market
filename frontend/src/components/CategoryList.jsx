import React from 'react';
import { useTemplates } from '@/contexts/TemplateContext';
import { REGISTRY } from '@/components/templates/TemplateRegistry';

export function CategoryList({ categories }) {
  const templatesContext = useTemplates() || {};
  const templates = templatesContext.templates || {};

  const activeVariantName = templates?.CategoryList || REGISTRY.CategoryList.default;
  const ActiveTemplate = REGISTRY.CategoryList.variants[activeVariantName] || REGISTRY.CategoryList.variants.Default;

  return <ActiveTemplate categories={categories} />;
}

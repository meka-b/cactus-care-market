import React from 'react';
import { useTemplates } from '@/contexts/TemplateContext';
import { REGISTRY } from './TemplateRegistry';

export function DynamicComponent({ name, ...props }) {
  const { templates, loading } = useTemplates();
  
  if (loading) {
    return <div className="shimmer w-full h-full min-h-[100px] rounded-xl" />;
  }

  const componentConfig = REGISTRY[name];
  if (!componentConfig) {
    console.error(`DynamicComponent: Component "${name}" not found in REGISTRY.`);
    return null;
  }

  // Find active variant: Priority 1: explicitly passed as prop (for preview), Priority 2: from DB, Priority 3: default
  const activeVariantName = props._forceVariant || templates[name] || componentConfig.default;
  const Component = componentConfig.variants[activeVariantName] || componentConfig.variants[componentConfig.default];

  if (!Component) {
    console.error(`DynamicComponent: Variant "${activeVariantName}" not found for "${name}".`);
    return null;
  }

  // Remove the special preview prop before passing down
  const passProps = { ...props };
  delete passProps._forceVariant;
  delete passProps.imageRatio; // Delete if passed explicitly so we don't accidentally override unless we want to. Wait, if it's passed explicitly (like in AdminDesigner), we SHOULD use it!
  
  const imageRatio = props.imageRatio || templates[`${name}_imageRatio`] || '1:1';

  return <Component {...passProps} imageRatio={imageRatio} />;
}

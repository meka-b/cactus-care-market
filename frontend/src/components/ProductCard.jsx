import React from 'react';
import { DynamicComponent } from './templates/DynamicComponent';

export function ProductCard(props) {
  return <DynamicComponent name="ProductCard" {...props} />;
}

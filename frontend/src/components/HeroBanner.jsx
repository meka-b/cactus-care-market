import React from 'react';
import { DynamicComponent } from './templates/DynamicComponent';

export function HeroBanner(props) {
  return <DynamicComponent name="HeroBanner" {...props} />;
}

import React from 'react';
import { DynamicComponent } from './templates/DynamicComponent';

export function BundleModule(props) {
  return <DynamicComponent name="BundleModule" {...props} />;
}


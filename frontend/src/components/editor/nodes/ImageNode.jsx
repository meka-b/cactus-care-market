import { DecoratorNode } from 'lexical';
import React from 'react';

export class ImageNode extends DecoratorNode {
  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src, altText, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  createDOM(config) {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <img 
        src={this.__src} 
        alt={this.__altText} 
        className="max-w-full rounded-xl shadow-sm my-4 border border-slate-200" 
      />
    );
  }

  exportJSON() {
    return {
      src: this.__src,
      altText: this.__altText,
      type: 'image',
      version: 1,
    };
  }

  static importJSON(serializedNode) {
    const node = $createImageNode(serializedNode.src, serializedNode.altText);
    return node;
  }
}

export function $createImageNode(src, altText) {
  return new ImageNode(src, altText);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}

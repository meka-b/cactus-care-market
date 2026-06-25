import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

// Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { ImageNode } from './editor/nodes/ImageNode';

import LexicalTheme from './editor/LexicalTheme';

const editorConfig = {
  namespace: 'CactusBlogReader',
  theme: LexicalTheme,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
    ImageNode
  ],
  editable: false,
  onError(error) {
    console.error(error);
  },
};

export function BlogRenderer({ data }) {
  if (!data) return null;
  
  let validState = undefined;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed && parsed.root) {
      validState = JSON.stringify(parsed);
    }
  } catch (err) {
    // skip invalid state
  }

  const initialConfig = {
    ...editorConfig,
    editorState: validState,
  };

  if (!validState) return <div className="text-slate-400 italic">Geçersiz veya boş içerik.</div>;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="lexical-reader w-full">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="prose prose-emerald max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl focus:outline-none" />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  );
}

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

// Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { ImageNode } from './nodes/ImageNode';

// Plugins
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import LexicalTheme from './LexicalTheme';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import FloatingToolbarPlugin from './plugins/FloatingToolbarPlugin';
import SlashCommandPlugin from './plugins/SlashCommandPlugin';

const editorConfig = {
  namespace: 'CactusBlogEditor',
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
  onError(error) {
    console.error(error);
  },
};

function EditorRefPlugin({ onEditorReady }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);
  return null;
}

export default function LexicalEditor({ content, onChange, onUploadImage, onEditorReady }) {
  let safeEditorState = undefined;
  if (content) {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      if (parsed && parsed.root) {
        safeEditorState = JSON.stringify(parsed);
      }
    } catch (e) {
      console.warn("Invalid lexical content, loading empty editor.", e);
    }
  }

  const initialConfig = {
    ...editorConfig,
    editorState: safeEditorState,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorRefPlugin onEditorReady={onEditorReady} />
      <div className="lexical-editor-container flex flex-col md:flex-row items-start border border-border rounded-xl bg-white shadow-sm overflow-visible">
        <ToolbarPlugin onUploadImage={onUploadImage} />
        <div className="relative flex-1 min-w-0 w-full border-t md:border-t-0 md:border-l border-slate-200 bg-white z-0 cursor-text" onClick={() => {
          // If clicked outside the actual text, we can focus the editor.
          // Lexical handles clicking inside ContentEditable.
        }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] h-full w-full max-w-none p-4 sm:p-8 cursor-text" />
            }
            placeholder={<div className="absolute top-4 sm:top-8 left-4 sm:left-8 text-slate-300 pointer-events-none select-none">Yazmaya başlayın veya komutlar için / tuşuna basın...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={(editorState) => {
            if (onChange) {
              onChange(editorState.toJSON());
            }
          }} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin />
          <MarkdownShortcutPlugin />
          <FloatingToolbarPlugin />
          <SlashCommandPlugin onUploadImage={onUploadImage} />
        </div>
      </div>
    </LexicalComposer>
  );
}

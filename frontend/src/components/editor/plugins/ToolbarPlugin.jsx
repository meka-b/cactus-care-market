import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, UNDO_COMMAND, REDO_COMMAND, CAN_UNDO_COMMAND, CAN_REDO_COMMAND, $insertNodes } from 'lexical';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createImageNode } from '../nodes/ImageNode';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Quote, Code, Undo, Redo, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Sparkles, Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ToolbarPlugin({ onUploadImage }) {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);
      
      if (elementDOM !== null) {
        if ($isHeadingNode(element)) {
          setBlockType(element.getTag());
        } else {
          setBlockType(element.getType());
        }
      }
    }
  }, [activeEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(CAN_UNDO_COMMAND, (payload) => { setCanUndo(payload); return false; }, 1),
      editor.registerCommand(CAN_REDO_COMMAND, (payload) => { setCanRedo(payload); return false; }, 1),
    );
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const insertLink = useCallback(() => {
    if (!isLink) {
      const url = prompt('Link URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        setIsLink(true);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      setIsLink(false);
    }
  }, [editor, isLink]);

  const insertImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file && onUploadImage) {
        const toastId = toast.loading('Görsel yükleniyor...');
        try {
          const url = await onUploadImage(file);
          editor.update(() => {
            const imageNode = $createImageNode(url, file.name);
            $insertNodes([imageNode]);
          });
          toast.success('Görsel eklendi.', { id: toastId });
        } catch (err) {
          toast.error('Görsel yüklenemedi.', { id: toastId });
        }
      }
    };
    input.click();
  }, [editor, onUploadImage]);

  const handleAIAction = async (action) => {
    setAiLoading(true);
    const toastId = toast.loading('AI düşünüyor...');
    
    let selectedText = '';
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selectedText = selection.getTextContent();
      }
    });

    if (!selectedText || selectedText.trim() === '') {
      setAiLoading(false);
      toast.error('Lütfen işlem yapılacak metni seçin.', { id: toastId });
      return;
    }

    try {
      const { data } = await api.post(`/seo/${action}`, { text: selectedText });
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          sel.insertText(data.result);
        }
      });
      toast.success('AI işlemi başarılı.', { id: toastId });
    } catch (err) {
      toast.error('AI işlemi sırasında hata oluştu.', { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex md:flex-col gap-4 p-4 bg-slate-50/80 md:w-56 shrink-0 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto z-10 flex-wrap md:flex-nowrap border-b md:border-b-0">
      
      {/* Undo/Redo Group */}
      <div className="flex flex-col gap-2 w-full pb-4 border-b border-slate-200/60">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Geçmiş</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Formatting Group */}
      <div className="flex flex-col gap-2 w-full pb-4 border-b border-slate-200/60">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Biçim</span>
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${isBold ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${isItalic ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${isUnderline ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}>
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${isStrikethrough ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}>
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${isCode ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}>
            <Code className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Blocks Group */}
      <div className="flex flex-col gap-2 w-full pb-4 border-b border-slate-200/60">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Bloklar</span>
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${blockType === 'h1' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => formatHeading('h1')}>
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${blockType === 'h2' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => formatHeading('h2')}>
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${blockType === 'h3' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={() => formatHeading('h3')}>
            <Heading3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-8 w-8 ${blockType === 'quote' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100'}`} onClick={formatQuote}>
            <Quote className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Insert Group */}
      <div className="flex flex-col gap-2 w-full pb-4 border-b border-slate-200/60">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Ekle</span>
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={insertLink}>
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={insertImage}>
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alignment Group */}
      <div className="flex flex-col gap-2 w-full pb-4 border-b border-slate-200/60">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Hizalama</span>
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}>
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}>
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}>
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-100" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}>
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Group */}
      <div className="flex flex-col gap-2 w-full pb-4">
        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider pl-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Asistanı
        </span>
        <div className="flex flex-col gap-2">
          <Button disabled={aiLoading} onClick={() => handleAIAction('ai-rewrite')} variant="secondary" size="sm" className="w-full justify-start h-8 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100">
            <Sparkles className="w-3 h-3 mr-2" /> Yeniden Yaz
          </Button>
          <Button disabled={aiLoading} onClick={() => handleAIAction('ai-expand')} variant="secondary" size="sm" className="w-full justify-start h-8 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100">
            <Plus className="w-3 h-3 mr-2" /> Genişlet
          </Button>
          <Button disabled={aiLoading} onClick={() => handleAIAction('ai-summarize')} variant="secondary" size="sm" className="w-full justify-start h-8 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100">
            <Wand2 className="w-3 h-3 mr-2" /> Özetle
          </Button>
        </div>
      </div>
    </div>
  );
}

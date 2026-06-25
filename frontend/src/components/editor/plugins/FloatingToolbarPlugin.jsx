import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { mergeRegister } from '@lexical/utils';
import { createPortal } from 'react-dom';
import { Bold, Italic, Strikethrough, Sparkles, Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isText, setIsText] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const popupRef = useRef(null);
  const [aiLoading, setAiLoading] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        selection !== null &&
        nativeSelection !== null &&
        !nativeSelection.isCollapsed &&
        rootElement !== null &&
        rootElement.contains(nativeSelection.anchorNode)
      ) {
        setIsText($isRangeSelection(selection));
        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setIsStrikethrough(selection.hasFormat('strikethrough'));

        const domRange = nativeSelection.getRangeAt(0);
        const rect = domRange.getBoundingClientRect();
        
        if (popupRef.current) {
          popupRef.current.style.opacity = '1';
          popupRef.current.style.top = `${rect.top - 50 + window.scrollY}px`;
          popupRef.current.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
          popupRef.current.style.transform = 'translate(-50%, 0)';
        }
      } else {
        setIsText(false);
      }
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      })
    );
  }, [editor, updatePopup]);

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

    if (!selectedText) {
      setAiLoading(false);
      return;
    }

    try {
      const { data } = await api.post(`/seo/${action}`, { text: selectedText });
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(data.result, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          sel.insertNodes(nodes);
        }
      });
      toast.success('AI işlemi başarılı.', { id: toastId });
    } catch (err) {
      toast.error('AI işlemi sırasında hata oluştu.', { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  if (!isText) return null;

  return createPortal(
    <div ref={popupRef} className="absolute z-[200] flex items-center gap-1 p-1 bg-slate-900 text-white rounded-lg shadow-xl opacity-0 transition-opacity pointer-events-auto">
      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
        <Button variant="ghost" size="icon" className={`h-8 w-8 text-white hover:bg-slate-800 ${isBold ? 'bg-slate-800' : ''}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className={`h-8 w-8 text-white hover:bg-slate-800 ${isItalic ? 'bg-slate-800' : ''}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}>
          <Italic className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className={`h-8 w-8 text-white hover:bg-slate-800 ${isStrikethrough ? 'bg-slate-800' : ''}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}>
          <Strikethrough className="w-4 h-4" />
        </Button>
      </div>
      
      {/* AI Tools */}
      <div className="flex items-center gap-1 pl-1">
        <Button disabled={aiLoading} onClick={() => handleAIAction('ai-rewrite')} variant="ghost" size="sm" className="h-8 text-xs text-indigo-300 hover:text-indigo-200 hover:bg-slate-800">
          <Sparkles className="w-3 h-3 mr-1" /> Yeniden Yaz
        </Button>
        <Button disabled={aiLoading} onClick={() => handleAIAction('ai-expand')} variant="ghost" size="sm" className="h-8 text-xs text-emerald-300 hover:text-emerald-200 hover:bg-slate-800">
          <Plus className="w-3 h-3 mr-1" /> Genişlet
        </Button>
        <Button disabled={aiLoading} onClick={() => handleAIAction('ai-summarize')} variant="ghost" size="sm" className="h-8 text-xs text-orange-300 hover:text-orange-200 hover:bg-slate-800">
          <Wand2 className="w-3 h-3 mr-1" /> Özetle
        </Button>
      </div>
    </div>,
    document.body
  );
}

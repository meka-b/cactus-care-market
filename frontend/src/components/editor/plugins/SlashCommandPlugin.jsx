import React, { useCallback, useState, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalTypeaheadMenuPlugin } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { createPortal } from 'react-dom';
import { Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Image as ImageIcon } from 'lucide-react';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { $getSelection, $isRangeSelection } from 'lexical';

class CommandOption {
  constructor(title, icon, onSelect) {
    this.title = title;
    this.icon = icon;
    this.onSelect = onSelect;
  }
}

export default function SlashCommandPlugin({ onUploadImage }) {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState(null);

  const getOptions = useCallback(() => {
    const baseOptions = [
      new CommandOption('Başlık 1', <Heading1 className="w-4 h-4" />, () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h1'));
          }
        });
      }),
      new CommandOption('Başlık 2', <Heading2 className="w-4 h-4" />, () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h2'));
          }
        });
      }),
      new CommandOption('Başlık 3', <Heading3 className="w-4 h-4" />, () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h3'));
          }
        });
      }),
      new CommandOption('Sırasız Liste', <List className="w-4 h-4" />, () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      }),
      new CommandOption('Sıralı Liste', <ListOrdered className="w-4 h-4" />, () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }),
      new CommandOption('Alıntı', <Quote className="w-4 h-4" />, () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        });
      }),
    ];

    if (!queryString) return baseOptions;
    return baseOptions.filter(o => o.title.toLowerCase().includes(queryString.toLowerCase()));
  }, [editor, queryString]);

  const options = getOptions();

  const onSelectOption = useCallback((selectedOption, nodeToRemove, closeMenu) => {
    editor.update(() => {
      nodeToRemove?.remove();
      selectedOption.onSelect();
    });
    closeMenu();
  }, [editor]);

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={(text) => {
        const match = /^\/([a-zA-Z0-9ığüşöçİĞÜŞÖÇ]*)$/.exec(text);
        if (match !== null) {
          return {
            leadOffset: match.index,
            matchingString: match[1],
            replaceableString: match[0],
          };
        }
        return null;
      }}
      options={options}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        if (anchorElementRef.current == null || options.length === 0) return null;

        const rect = anchorElementRef.current.getBoundingClientRect();
        
        return createPortal(
          <div 
            className="bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden w-64 absolute z-[200]"
            style={{
              top: rect.bottom + window.scrollY + 10,
              left: rect.left + window.scrollX,
            }}
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-100">
              Blok Ekle
            </div>
            <ul className="max-h-64 overflow-y-auto p-1 m-0 list-none">
              {options.map((option, i) => (
                <li
                  key={option.title}
                  className={`flex items-center gap-3 px-2 py-2 cursor-pointer rounded-md transition-colors ${selectedIndex === i ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                  onClick={() => selectOptionAndCleanUp(option)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <div className="bg-white p-1 rounded border border-slate-200 text-slate-600 shadow-sm">
                    {option.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{option.title}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        );
      }}
    />
  );
}

import React, { useRef, useState } from 'react';

import { useTemplateButtons } from '../../../hooks/shared';
import { useWordLinkSuggestion } from '../../../hooks/useWordLinkSuggestion';
import { TemplateButton } from '../../../types/components';
import { appendTemplateText } from '../../../utils/textTemplates';
import { MarkdownContent } from '../MarkdownContent';
import { TemplateButtonRow } from '../TemplateButtonRow';

import {
  applyBold,
  applyItalic,
  applyUnderline,
  applyQuote,
  applyCode,
  applyLink,
  applyBulletList,
  applyNumberedList,
  MarkdownFormatResult,
} from './markdownFormatting';
import { getHistoryShortcut } from './markdownHistory';
import { MarkdownToolbar, MarkdownFormatAction } from './MarkdownToolbar';
import { ResizableEditorBox } from './ResizableEditorBox';
import { insertSymbol } from './symbolFormatting';
import { getScrollTopToReveal, measureCaretBounds } from './textareaCaret';
import { useMarkdownHistory } from './useMarkdownHistory';
import { insertWordLink } from './wordLinkFormatting';
import { WordLinkSuggestionBanner } from './WordLinkSuggestionBanner';

const FORMAT_HANDLERS: Record<
  MarkdownFormatAction,
  (value: string, start: number, end: number) => MarkdownFormatResult
> = {
  bold: applyBold,
  italic: applyItalic,
  underline: applyUnderline,
  quote: applyQuote,
  code: applyCode,
  link: applyLink,
  bulletList: applyBulletList,
  numberedList: applyNumberedList,
};

interface MarkdownEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Associates the label with the textarea via htmlFor/id; required for that link to work when `label` is set. */
  id?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /**
   * 'fixed' = h-78 box the user can drag taller, see `ResizableEditorBox`
   * (Definition/Question notes); 'flex' = fills its container (Note content).
   */
  heightMode?: 'fixed' | 'flex';
  rows?: number;
  fontMono?: boolean;
  /** Word/question `notes` fields persist literal `\n` sequences that need unescaping to render. */
  unescapeLiteralNewlines?: boolean;
  /** Snippets offered above the editor; the selected one is inserted at the caret. */
  templateButtons?: TemplateButton[];
  /** Never offered as a word-link suggestion, e.g. the word whose own definition is being edited. */
  excludeWord?: string | null;
}

export const MarkdownEditorField: React.FC<MarkdownEditorFieldProps> = ({
  value,
  onChange,
  id,
  label,
  placeholder = 'Enter content...',
  disabled = false,
  heightMode = 'fixed',
  rows = 8,
  fontMono = false,
  unescapeLiteralNewlines = false,
  templateButtons = [],
  excludeWord,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    suggestion,
    queueProgress,
    notifyChange,
    notifyBlur,
    dismissSuggestion,
  } = useWordLinkSuggestion(excludeWord);
  const { templateButtonsConfig: symbolButtons } = useTemplateButtons({
    configFileName: 'markdownEditorSymbolsConfig.json',
  });
  const symbolInsertPositionRef = useRef({ start: 0, end: 0 });
  const history = useMarkdownHistory(value);
  const isComposingRef = useRef(false);
  /** Whether the textarea's selection reflects a caret the user has placed. */
  const hasCaretRef = useRef(false);

  /**
   * Pushes `result` to the owner of `value` and restores its selection once
   * rendered, keeping the scroll position unless the caret would end up out
   * of view.
   */
  const applyResult = (result: MarkdownFormatResult) => {
    const textarea = textareaRef.current;
    const scrollTop = textarea?.scrollTop ?? 0;

    onChange(result.value);

    if (!textarea) {
      return;
    }
    // Rewriting the value moves the caret to the end, and focusing scrolls
    // that caret into view; neither reflects where the edit happened.
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
      textarea.scrollTop = getScrollTopToReveal(
        scrollTop,
        textarea.clientHeight,
        measureCaretBounds(textarea, result.selectionEnd),
      );
    });
  };

  /** Applies a self-contained edit (toolbar action, insertion) as its own undo step. */
  const applyStep = (result: MarkdownFormatResult) => {
    history.recordStep(result);
    applyResult(result);
  };

  const restoreHistoryEntry = (entry: MarkdownFormatResult | null) => {
    if (!entry) {
      return;
    }
    applyResult(entry);
    notifyChange(entry.value, entry.selectionEnd);
  };

  const handleUndo = () => restoreHistoryEntry(history.undo());

  const handleRedo = () => restoreHistoryEntry(history.redo());

  const handleFormat = (action: MarkdownFormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    applyStep(FORMAT_HANDLERS[action](value, selectionStart, selectionEnd));
  };

  const handleOpenSymbolMenu = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    symbolInsertPositionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  };

  const handleInsertSymbol = (symbolValue: string) => {
    const { start, end } = symbolInsertPositionRef.current;
    applyStep(insertSymbol(value, start, end, symbolValue));
  };

  /**
   * Inserts a template at the caret, replacing any selection. Until the user
   * has placed a caret in the textarea, it is appended to the end instead so
   * it never lands at the top of existing content by accident.
   */
  const handleInsertTemplate = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    if (!hasCaretRef.current) {
      const appended = appendTemplateText(value, template);
      applyStep({
        value: appended,
        selectionStart: appended.length,
        selectionEnd: appended.length,
      });
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    applyStep(insertSymbol(value, selectionStart, selectionEnd, template));
  };

  const handleTogglePreview = (nextIsPreview: boolean) => {
    // Preview unmounts the textarea, and the one shown on returning to Edit
    // starts without the user's caret.
    if (nextIsPreview) {
      hasCaretRef.current = false;
    }
    setIsPreview(nextIsPreview);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value: newValue, selectionStart, selectionEnd } = e.target;

    history.recordTyping(
      { value: newValue, selectionStart, selectionEnd },
      isComposingRef.current,
    );
    onChange(newValue);
    if (!disabled) {
      notifyChange(newValue, selectionStart);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.nativeEvent.isComposing) {
      return;
    }

    const shortcut = getHistoryShortcut(e);
    if (!shortcut) {
      return;
    }

    // The browser's native undo stack is unaware of programmatic edits
    // (toolbar actions, insertions), so it must not run alongside ours.
    e.preventDefault();
    if (shortcut === 'undo') {
      handleUndo();
    } else {
      handleRedo();
    }
  };

  const handleTextareaBlur = () => {
    if (!disabled) {
      notifyBlur(value);
    }
  };

  const handleInsertWordLink = () => {
    if (!suggestion) {
      return;
    }

    const result = insertWordLink(
      value,
      suggestion.insertPosition,
      suggestion.word,
    );
    applyStep(result);
    dismissSuggestion(result.value);
  };

  const isFlex = heightMode === 'flex';

  const previewClassName = isFlex
    ? 'min-h-0 flex-1 overflow-y-auto px-3 py-2'
    : 'h-full overflow-y-auto px-3 py-2';

  const textareaClassName = `${
    isFlex ? 'min-h-0 w-full flex-1' : 'block h-full w-full'
  } resize-none border-0 bg-transparent px-3 py-2 ${
    fontMono ? 'font-mono text-sm' : ''
  } text-gray-900 placeholder-gray-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:placeholder-gray-400`;

  const editorContent = isPreview ? (
    <div className={previewClassName}>
      {value.trim() ? (
        <MarkdownContent
          content={value}
          unescapeLiteralNewlines={unescapeLiteralNewlines}
        />
      ) : (
        <p className='text-supporting text-sm'>Nothing to preview.</p>
      )}
    </div>
  ) : (
    <textarea
      id={id}
      ref={textareaRef}
      value={value}
      onChange={handleTextareaChange}
      onFocus={() => {
        hasCaretRef.current = true;
      }}
      onBlur={handleTextareaBlur}
      onKeyDown={handleTextareaKeyDown}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
      }}
      rows={rows}
      className={textareaClassName}
      placeholder={placeholder}
      disabled={disabled}
    />
  );

  return (
    <div className={isFlex ? 'flex flex-1 flex-col' : undefined}>
      {label && (
        <label
          htmlFor={id}
          className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
        >
          {label}
        </label>
      )}

      <TemplateButtonRow
        buttons={templateButtons}
        onSelect={handleInsertTemplate}
        disabled={disabled || isPreview}
        tooltip={isPreview ? 'Switch to Edit mode to use templates' : undefined}
      />

      <div
        className={`glass-input overflow-hidden transition-[border-color,box-shadow] duration-300 focus-within:border-primary-400/70 focus-within:ring-2 focus-within:ring-primary-400/30 motion-reduce:transition-none dark:focus-within:border-primary-400/50 dark:focus-within:ring-primary-400/20 ${
          isFlex ? 'flex min-h-0 flex-1 flex-col' : 'mb-1'
        } ${suggestion ? 'glass-glow glass-glow-blue' : ''}`}
      >
        <MarkdownToolbar
          onFormat={handleFormat}
          disabled={disabled}
          isPreview={isPreview}
          onTogglePreview={handleTogglePreview}
          symbolButtons={symbolButtons}
          onOpenSymbolMenu={handleOpenSymbolMenu}
          onInsertSymbol={handleInsertSymbol}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
        {suggestion && (
          <WordLinkSuggestionBanner
            word={suggestion.word}
            progress={queueProgress}
            onInsert={handleInsertWordLink}
            onDismiss={() => dismissSuggestion(value)}
          />
        )}
        {isFlex ? (
          editorContent
        ) : (
          // Edit and Preview share this box so a resize survives toggling.
          <ResizableEditorBox>{editorContent}</ResizableEditorBox>
        )}
        <div className='text-supporting flex shrink-0 items-center gap-1.5 border-t border-white/40 px-2 py-1 text-xs italic dark:border-white/10'>
          <span className='flex h-4 w-6 shrink-0 items-center justify-center rounded-sm border border-current text-[10px] leading-none font-bold not-italic'>
            M↓
          </span>
          <span>Markdown is supported</span>
        </div>
      </div>
    </div>
  );
};

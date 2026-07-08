import React, { useRef, useState } from 'react';

import { TemplateButton } from '../../../types/components';
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
import { MarkdownToolbar, MarkdownFormatAction } from './MarkdownToolbar';

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
  /** 'fixed' = h-52 box (Definition/Question notes); 'flex' = fills its container (Note content). */
  heightMode?: 'fixed' | 'flex';
  rows?: number;
  fontMono?: boolean;
  /** Word/question `notes` fields persist literal `\n` sequences that need unescaping to render. */
  unescapeLiteralNewlines?: boolean;
  templateButtons?: TemplateButton[];
  onAppendTemplate?: (textToAppend: string) => void;
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
  onAppendTemplate,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (action: MarkdownFormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    const result = FORMAT_HANDLERS[action](value, selectionStart, selectionEnd);

    onChange(result.value);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const isFlex = heightMode === 'flex';

  const previewClassName = isFlex
    ? 'min-h-0 flex-1 overflow-y-auto bg-white px-3 py-2 dark:bg-gray-700'
    : 'h-52 overflow-y-auto bg-white px-3 py-2 dark:bg-gray-700';

  const textareaClassName = `${
    isFlex ? 'min-h-0 w-full flex-1' : 'block h-52 w-full'
  } resize-none border-0 bg-white px-3 py-2 ${
    fontMono ? 'font-mono text-sm' : ''
  } text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800`;

  const editorContent = isPreview ? (
    <div className={previewClassName}>
      {value.trim() ? (
        <MarkdownContent
          content={value}
          unescapeLiteralNewlines={unescapeLiteralNewlines}
        />
      ) : (
        <p className='text-sm text-gray-400 dark:text-gray-500'>
          Nothing to preview.
        </p>
      )}
    </div>
  ) : (
    <textarea
      id={id}
      ref={textareaRef}
      value={value}
      onChange={e => onChange(e.target.value)}
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

      {onAppendTemplate && (
        <TemplateButtonRow
          buttons={templateButtons}
          onSelect={onAppendTemplate}
          disabled={disabled || isPreview}
          tooltip={
            isPreview ? 'Switch to Edit mode to use templates' : undefined
          }
        />
      )}

      <div
        className={`overflow-hidden rounded-md border border-gray-300 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 ${
          isFlex ? 'flex min-h-0 flex-1 flex-col' : 'mb-1'
        }`}
      >
        <MarkdownToolbar
          onFormat={handleFormat}
          disabled={disabled}
          isPreview={isPreview}
          onTogglePreview={setIsPreview}
        />
        {editorContent}
        <div className='flex flex-shrink-0 items-center gap-1.5 border-t border-gray-300 bg-gray-50 px-2 py-1 text-xs italic text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500'>
          <span className='flex h-4 w-6 flex-shrink-0 items-center justify-center rounded border border-current text-[10px] font-bold not-italic leading-none'>
            M↓
          </span>
          <span>Markdown is supported</span>
        </div>
      </div>
    </div>
  );
};

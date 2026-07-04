import React, { useState } from 'react';

import { MarkdownContent } from '../../../../components/ui';
import { TemplateButton } from '../types/question-form';

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  templateButtons?: TemplateButton[];
  onAppendTemplate?: (textToAppend: string) => void;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  value,
  onChange,
  disabled = false,
  templateButtons = [],
  onAppendTemplate,
}) => {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div>
      <label
        htmlFor='notes'
        className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Explanation / Notes
      </label>

      {/* Template buttons - only show if config is available */}
      {templateButtons.length > 0 && onAppendTemplate && (
        <div className='mb-3'>
          <div className='flex flex-wrap gap-2'>
            {templateButtons.map((button, index) => (
              <button
                key={index}
                type='button'
                disabled={disabled || isPreview}
                onClick={() => onAppendTemplate(button.value)}
                title={
                  isPreview ? 'Switch to Edit mode to use templates' : undefined
                }
                className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  disabled || isPreview
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
          <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
            Click buttons above to quickly add note templates
          </p>
        </div>
      )}

      {/* Edit/Preview toggle */}
      <div className='mb-1 flex justify-end'>
        <div className='flex rounded-md border border-gray-300 text-xs dark:border-gray-600'>
          <button
            type='button'
            onClick={() => setIsPreview(false)}
            className={`rounded-l-md px-3 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              !isPreview
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Edit
          </button>
          <button
            type='button'
            onClick={() => setIsPreview(true)}
            className={`rounded-r-md border-l border-gray-300 px-3 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 ${
              isPreview
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className='mb-1'>
        {isPreview ? (
          <div className='h-52 overflow-y-auto rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600'>
            {value.trim() ? (
              <MarkdownContent content={value} />
            ) : (
              <p className='text-sm text-gray-400 dark:text-gray-500'>
                Nothing to preview.
              </p>
            )}
          </div>
        ) : (
          <textarea
            id='notes'
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={8}
            className='block h-52 w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800'
            placeholder='Enter explanation or additional notes (supports Markdown)...'
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

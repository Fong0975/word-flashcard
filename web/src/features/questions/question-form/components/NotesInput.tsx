import React from 'react';

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
                onClick={() => onAppendTemplate(button.value)}
                disabled={disabled}
                className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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

      <textarea
        id='notes'
        value={value ? value.replace(/\\n/g, '\n') : ''}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className='w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800'
        placeholder='Enter explanation or additional notes (supports Markdown)...'
        disabled={disabled}
      />
    </div>
  );
};

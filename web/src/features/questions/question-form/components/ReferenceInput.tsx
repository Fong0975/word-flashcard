import React from 'react';

import { TemplateButton } from '../types/question-form';

interface ReferenceInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  templateButtons?: TemplateButton[];
  onSelectTemplate?: (templateText: string) => void;
}

export const ReferenceInput: React.FC<ReferenceInputProps> = ({
  value,
  onChange,
  disabled = false,
  templateButtons = [],
  onSelectTemplate,
}) => {
  return (
    <div>
      <label
        htmlFor='reference'
        className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Reference
      </label>

      {/* Template buttons - only show if config is available */}
      {templateButtons.length > 0 && onSelectTemplate && (
        <div className='mb-3'>
          <div className='flex flex-wrap gap-2'>
            {templateButtons.map((button, index) => (
              <button
                key={index}
                type='button'
                onClick={() => onSelectTemplate(button.value)}
                disabled={disabled}
                className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                {button.label}
              </button>
            ))}
          </div>
          <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
            Click buttons above to quickly select reference templates
          </p>
        </div>
      )}

      <input
        type='text'
        id='reference'
        value={value}
        onChange={e => onChange(e.target.value)}
        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800'
        placeholder='Enter source or reference (optional)...'
        disabled={disabled}
      />
    </div>
  );
};

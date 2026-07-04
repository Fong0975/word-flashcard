import React from 'react';

import { TemplateButton } from '../../types/components';

interface TemplateButtonRowProps {
  buttons: TemplateButton[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  tooltip?: string;
  helperText?: string;
}

export const TemplateButtonRow: React.FC<TemplateButtonRowProps> = ({
  buttons,
  onSelect,
  disabled = false,
  tooltip,
  helperText = 'Click buttons above to quickly add note templates',
}) => {
  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className='mb-3'>
      <div className='flex flex-wrap gap-2'>
        {buttons.map((button, index) => (
          <button
            key={index}
            type='button'
            disabled={disabled}
            onClick={() => onSelect(button.value)}
            title={tooltip}
            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              disabled
                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
      <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
        {helperText}
      </p>
    </div>
  );
};

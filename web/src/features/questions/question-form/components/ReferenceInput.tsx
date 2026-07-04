import React from 'react';

import { TemplateButtonRow } from '../../../../components/ui';
import { TemplateButton } from '../../../../types/components';

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
      {onSelectTemplate && (
        <TemplateButtonRow
          buttons={templateButtons}
          onSelect={onSelectTemplate}
          disabled={disabled}
          helperText='Click buttons above to quickly select reference templates'
        />
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

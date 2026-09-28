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
        className='glass-input w-full px-3 py-2'
        placeholder='Enter source or reference (optional)...'
        disabled={disabled}
      />
    </div>
  );
};

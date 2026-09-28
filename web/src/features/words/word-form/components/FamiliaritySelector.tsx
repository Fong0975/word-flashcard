import React from 'react';

import { DropdownMenu } from '../../../../components/ui';
import { FamiliarityLevel } from '../../../../types/base';
import { FAMILIARITY_OPTIONS } from '../../../shared/constants/familiarity';

interface FamiliaritySelectorProps {
  value: FamiliarityLevel;
  onChange: (familiarity: FamiliarityLevel) => void;
  disabled: boolean;
  mode: 'create' | 'edit';
}

export const FamiliaritySelector: React.FC<FamiliaritySelectorProps> = ({
  value,
  onChange,
  disabled,
  mode,
}) => {
  // Only show in edit mode
  if (mode !== 'edit') {
    return null;
  }

  const selectedOption = FAMILIARITY_OPTIONS.find(
    option => option.value === value,
  );

  return (
    <div>
      <label
        htmlFor='familiarity'
        className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Familiarity Level
      </label>
      <p className='mb-2 text-xs text-gray-500 dark:text-gray-400'>
        Choose your familiarity level with this word
      </p>
      <div className='pl-3'>
        <DropdownMenu
          className='block w-full'
          menuWidthClassName='w-full'
          disabled={disabled}
          trigger={
            <button
              type='button'
              id='familiarity'
              disabled={disabled}
              aria-label='Select familiarity level'
              aria-haspopup='true'
              className='glass-input flex w-full items-center justify-between px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50'
            >
              <span>
                {selectedOption?.label ?? 'Select familiarity level...'}
              </span>
              <svg
                className='h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
          }
          items={FAMILIARITY_OPTIONS.map(option => ({
            id: option.value,
            label: option.label,
            isSelected: option.value === value,
            onClick: () => onChange(option.value),
          }))}
        />
      </div>
    </div>
  );
};

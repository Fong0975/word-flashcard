import React from 'react';

import { DropdownMenu } from '../../../../components/ui';

interface AnswerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];

export const AnswerSelector: React.FC<AnswerSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <label
        htmlFor='answer'
        className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        Correct Answer <span className='text-red-500'>*</span>
      </label>
      <DropdownMenu
        className='block w-full'
        menuWidthClassName='w-full'
        disabled={disabled}
        trigger={
          <button
            type='button'
            id='answer'
            disabled={disabled}
            aria-label='Select the correct answer'
            aria-haspopup='true'
            className='glass-input flex w-full items-center justify-between px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50'
          >
            <span>{value || 'Select the correct answer...'}</span>
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
        items={ANSWER_OPTIONS.map(option => ({
          id: option,
          label: option,
          isSelected: option === value,
          onClick: () => onChange(option),
        }))}
      />
      <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
        Select the correct answer option (A, B, C, or D)
      </p>
    </div>
  );
};

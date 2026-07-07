import React from 'react';

import { ShuffledOption } from '../types';

interface OptionsSelectionListProps {
  options: ShuffledOption[];
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
}

export const OptionsSelectionList: React.FC<OptionsSelectionListProps> = ({
  options,
  selectedAnswer,
  onSelect,
}) => (
  <div className='space-y-3'>
    {options.map(option => (
      <label
        key={option.key}
        className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors lg:p-4 ${
          selectedAnswer === option.key
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
        } `}
      >
        <input
          type='radio'
          name='answer'
          value={option.key}
          checked={selectedAnswer === option.key}
          onChange={e => onSelect(e.target.value)}
          className='mt-1 h-4 w-4 border-gray-300 bg-gray-100 text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600'
        />
        <div className='flex-1'>
          <div className='flex items-start space-x-2'>
            <span className='inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
              {option.key}
            </span>
            <span className='leading-relaxed text-gray-700 dark:text-gray-300'>
              {option.value}
            </span>
          </div>
        </div>
      </label>
    ))}
  </div>
);

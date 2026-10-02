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
        className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-3 backdrop-blur-md transition-colors lg:p-4 ${
          selectedAnswer === option.key
            ? 'border-primary-400/70 bg-primary-500/15 ring-2 ring-primary-400/60 dark:border-primary-400/50 dark:bg-primary-400/10'
            : 'glass-panel-card hover:bg-gray-100/60 dark:hover:bg-gray-700/40'
        } `}
      >
        <input
          type='radio'
          name='answer'
          value={option.key}
          checked={selectedAnswer === option.key}
          onChange={e => onSelect(e.target.value)}
          className='glass-radio mt-1'
        />
        <div className='flex-1'>
          <div className='flex items-start space-x-2'>
            <span className='inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200'>
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

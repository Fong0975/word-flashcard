import React from 'react';

import { FamiliarityLevel } from '../constants';

const CATEGORY_ORDER = [
  FamiliarityLevel.RED,
  FamiliarityLevel.YELLOW,
  FamiliarityLevel.GREEN,
] as const;

const FAMILIARITY_LABELS: Record<FamiliarityLevel, string> = {
  [FamiliarityLevel.RED]: 'Unfamiliar',
  [FamiliarityLevel.YELLOW]: 'Somewhat Familiar',
  [FamiliarityLevel.GREEN]: 'Familiar',
};

const FAMILIARITY_DOT_COLORS: Record<FamiliarityLevel, string> = {
  [FamiliarityLevel.RED]: 'bg-red-500',
  [FamiliarityLevel.YELLOW]: 'bg-yellow-500',
  [FamiliarityLevel.GREEN]: 'bg-green-500',
};

interface CategoryCountInputsProps {
  categoryInputs: Record<FamiliarityLevel, string>;
  categoryCounts: Record<FamiliarityLevel, number>;
  onChange: (level: FamiliarityLevel, value: string) => void;
  maxCount: number;
  allZero: boolean;
}

export const CategoryCountInputs: React.FC<CategoryCountInputsProps> = ({
  categoryInputs,
  categoryCounts,
  onChange,
  maxCount,
  allZero,
}) => (
  <div>
    <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
      Words per Category
    </label>
    <div className='space-y-3'>
      {CATEGORY_ORDER.map(level => (
        <div key={level} className='flex items-center gap-3'>
          <div
            className={`h-4 w-4 flex-shrink-0 rounded-full ${FAMILIARITY_DOT_COLORS[level]}`}
          />
          <span className='flex-1 text-sm text-gray-700 dark:text-gray-300'>
            {FAMILIARITY_LABELS[level]}
          </span>
          <input
            type='number'
            min={0}
            max={maxCount}
            value={categoryInputs[level]}
            onChange={e => onChange(level, e.target.value)}
            className='w-20 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          />
        </div>
      ))}
    </div>
    <div className='mt-3 flex items-center gap-3 border-t border-gray-200 pt-3 dark:border-gray-600'>
      <div className='h-4 w-4 flex-shrink-0' />
      <span className='flex-1 text-sm font-medium text-gray-700 dark:text-gray-300'>
        Total
      </span>
      <div className='w-20 text-center text-sm font-semibold text-gray-900 dark:text-white'>
        {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
      </div>
    </div>
    <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
      Set a category to 0 to skip it.
    </p>
    {allZero && (
      <p className='mt-2 text-sm text-red-500'>
        Please set at least one category count greater than 0.
      </p>
    )}
  </div>
);

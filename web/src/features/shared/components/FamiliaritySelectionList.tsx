import React from 'react';

import { FAMILIARITY_OPTIONS, FamiliarityLevel } from '../constants';

interface FamiliaritySelectionListProps {
  selectedFamiliarity: FamiliarityLevel[];
  onToggle: (value: FamiliarityLevel) => void;
}

export const FamiliaritySelectionList: React.FC<
  FamiliaritySelectionListProps
> = ({ selectedFamiliarity, onToggle }) => (
  <div>
    <label className='mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300'>
      Select Familiarity Levels
    </label>
    <div className='space-y-2'>
      {FAMILIARITY_OPTIONS.map(option => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
            selectedFamiliarity.includes(option.value)
              ? option.bgColor + ' border-current'
              : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          } `}
        >
          <input
            type='checkbox'
            checked={selectedFamiliarity.includes(option.value)}
            onChange={() => onToggle(option.value)}
            className='sr-only'
          />
          <div
            className={`mr-3 h-4 w-4 rounded-full ${option.value === FamiliarityLevel.GREEN ? 'bg-green-500' : option.value === FamiliarityLevel.YELLOW ? 'bg-yellow-500' : 'bg-red-500'}`}
          />
          <span
            className={`font-medium ${selectedFamiliarity.includes(option.value) ? option.color : 'text-gray-700 dark:text-gray-300'}`}
          >
            {option.label} Level
          </span>
          {selectedFamiliarity.includes(option.value) && (
            <svg
              className='ml-auto h-4 w-4 text-current dark:text-gray-300'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </label>
      ))}
    </div>
    {selectedFamiliarity.length === 0 && (
      <p className='mt-2 text-sm text-red-500'>
        Please select at least one familiarity level.
      </p>
    )}
  </div>
);

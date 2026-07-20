import React from 'react';

import { FamiliarityLevel } from '../../../../types/base';

interface FamiliarityRatingButtonsProps {
  onSelect: (level: FamiliarityLevel) => void;
  disabled?: boolean;
  loadingLevel?: FamiliarityLevel | null;
}

export const FamiliarityRatingButtons: React.FC<
  FamiliarityRatingButtonsProps
> = ({ onSelect, disabled, loadingLevel }) => (
  <div className='flex flex-col justify-center space-y-4'>
    <button
      onClick={() => onSelect(FamiliarityLevel.RED)}
      disabled={disabled}
      className='flex min-w-[150px] flex-col items-center rounded-lg border-2 border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30'
    >
      {loadingLevel === FamiliarityLevel.RED ? (
        <div className='flex items-center justify-center'>
          <div
            role='status'
            aria-label='Loading'
            className='h-4 w-4 animate-spin rounded-full border-b-2 border-red-600'
          ></div>
        </div>
      ) : (
        <>
          <div className='mb-2 h-6 w-6 rounded-full bg-red-500'></div>
          <div className='text-center'>
            <div className='text-xs text-red-600 dark:text-red-400'>
              Unfamiliar
            </div>
          </div>
        </>
      )}
    </button>

    <button
      onClick={() => onSelect(FamiliarityLevel.YELLOW)}
      disabled={disabled}
      className='flex min-w-[150px] flex-col items-center rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-yellow-700 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
    >
      {loadingLevel === FamiliarityLevel.YELLOW ? (
        <div className='flex items-center justify-center'>
          <div
            role='status'
            aria-label='Loading'
            className='h-4 w-4 animate-spin rounded-full border-b-2 border-yellow-600'
          ></div>
        </div>
      ) : (
        <>
          <div className='mb-2 h-6 w-6 rounded-full bg-yellow-500'></div>
          <div className='text-center'>
            <div className='text-xs text-yellow-600 dark:text-yellow-400'>
              Somewhat Familiar
            </div>
          </div>
        </>
      )}
    </button>

    <button
      onClick={() => onSelect(FamiliarityLevel.GREEN)}
      disabled={disabled}
      className='flex min-w-[150px] flex-col items-center rounded-lg border-2 border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30'
    >
      {loadingLevel === FamiliarityLevel.GREEN ? (
        <div className='flex items-center justify-center'>
          <div
            role='status'
            aria-label='Loading'
            className='h-4 w-4 animate-spin rounded-full border-b-2 border-green-600'
          ></div>
        </div>
      ) : (
        <>
          <div className='mb-2 h-6 w-6 rounded-full bg-green-500'></div>
          <div className='text-center'>
            <div className='text-xs text-green-600 dark:text-green-400'>
              Familiar
            </div>
          </div>
        </>
      )}
    </button>
  </div>
);

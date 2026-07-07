import React from 'react';

interface DictionaryLookupHeaderProps {
  isLoadingDictionary: boolean;
  isCollapsed: boolean;
  onFetchDictionary: () => void;
  onToggleCollapsed: () => void;
}

export const DictionaryLookupHeader: React.FC<DictionaryLookupHeaderProps> = ({
  isLoadingDictionary,
  isCollapsed,
  onFetchDictionary,
  onToggleCollapsed,
}) => (
  <div className='flex items-center justify-between p-4 transition-colors hover:bg-green-100 dark:hover:bg-green-900/40'>
    <h3 className='text-lg font-medium text-green-800 dark:text-green-200'>
      Dictionary Lookup
    </h3>
    <div className='flex items-center space-x-2'>
      <button
        type='button'
        onClick={onFetchDictionary}
        disabled={isLoadingDictionary}
        className='rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400'
      >
        {isLoadingDictionary ? (
          <>
            <svg
              className='-ml-1 mr-2 inline h-4 w-4 animate-spin text-white'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          'Fetch Definition'
        )}
      </button>
      <button
        type='button'
        onClick={onToggleCollapsed}
        className='p-2 text-green-600 transition-colors hover:text-green-900 focus:outline-none dark:text-green-300 dark:hover:text-green-100'
      >
        <svg
          className={`h-5 w-5 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>
    </div>
  </div>
);

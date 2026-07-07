import React from 'react';

interface ReviewTabActionButtonsProps {
  showQuiz: boolean;
  onQuizSetup?: () => void;
  onRefresh?: () => void;
  isRefreshing: boolean;
  onNew?: () => void;
}

export const ReviewTabActionButtons: React.FC<ReviewTabActionButtonsProps> = ({
  showQuiz,
  onQuizSetup,
  onRefresh,
  isRefreshing,
  onNew,
}) => (
  <div className='mt-4 flex items-center justify-end space-x-3'>
    {/* Quiz Button */}
    {showQuiz && onQuizSetup && (
      <button
        onClick={() => onQuizSetup?.()}
        className='inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      >
        <svg
          className='mr-2 h-4 w-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
          />
        </svg>
        Quiz
      </button>
    )}

    {/* Refresh Button */}
    {onRefresh && (
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
        title='Refresh to get latest data'
      >
        {isRefreshing ? (
          <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current'></div>
        ) : (
          <svg
            className='mr-2 h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
        )}
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    )}

    {/* Add Button */}
    {onNew && (
      <button
        onClick={() => onNew?.()}
        className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
      >
        <svg
          className='mr-2 h-4 w-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M12 4v16m8-8H4'
          />
        </svg>
        Add
      </button>
    )}
  </div>
);

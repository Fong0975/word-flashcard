import React from 'react';

interface WordLinkSuggestionPopupProps {
  word: string;
  onInsert: () => void;
  onDismiss: () => void;
}

/**
 * Non-blocking hint shown when a backtick-wrapped word the user just typed
 * (e.g. `` `apple` ``) matches an existing saved word, offering to insert a
 * `/word/{word}` markdown link right after it.
 */
export const WordLinkSuggestionPopup: React.FC<
  WordLinkSuggestionPopupProps
> = ({ word, onInsert, onDismiss }) => {
  return (
    <div className='mt-2'>
      <div className='rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20'>
        <div className='flex items-start'>
          <svg
            className='mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5'
            />
          </svg>
          <div className='flex-1'>
            <p className='mb-2 text-sm text-blue-800 dark:text-blue-200'>
              Found &ldquo;{word}&rdquo; in your word bank — add a link?
            </p>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={onInsert}
                className='rounded px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-800/30'
              >
                Add link
              </button>
              <button
                type='button'
                onClick={onDismiss}
                className='rounded px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-blue-800/30'
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

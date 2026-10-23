import React from 'react';

interface WordLinkSuggestionBannerProps {
  word: string;
  /** Set while cascading through multiple blur-detected missed suggestions; omitted/null for a single typing-detected one. */
  progress?: { current: number; total: number } | null;
  onInsert: () => void;
  onDismiss: () => void;
}

/**
 * Non-blocking banner shown below the editor toolbar when a backtick-wrapped
 * word the user just typed (e.g. `` `apple` ``) matches an existing saved
 * word, offering to insert a `/word/{word}` markdown link right after it.
 */
export const WordLinkSuggestionBanner: React.FC<
  WordLinkSuggestionBannerProps
> = ({ word, progress, onInsert, onDismiss }) => {
  return (
    <div
      role='status'
      className='flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-blue-200/70 bg-blue-50/70 px-3 py-1.5 text-sm dark:border-blue-700/50 dark:bg-blue-900/30'
    >
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <svg
          className='h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5'
          />
        </svg>
        <p className='min-w-0 text-blue-800 dark:text-blue-200'>
          Found &ldquo;{word}&rdquo; in your word bank — add a link?
          {progress && progress.total > 1 && (
            <span className='ml-1 text-blue-600 dark:text-blue-400'>
              ({progress.current} of {progress.total})
            </span>
          )}
        </p>
      </div>
      <div className='ml-auto flex shrink-0 gap-1'>
        <button
          type='button'
          onClick={onInsert}
          className='rounded-sm px-2 py-0.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-800/30'
        >
          Add link
        </button>
        <button
          type='button'
          onClick={onDismiss}
          className='rounded-sm px-2 py-0.5 text-sm text-gray-600 transition-colors hover:bg-primary-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-400 dark:hover:bg-primary-800/30'
        >
          Skip
        </button>
      </div>
    </div>
  );
};

import React from 'react';

import { Word } from '../../../../types/api';
import { WordSearchState } from '../types';

interface SearchSuggestionsProps {
  searchState: WordSearchState;
  mode: 'create' | 'edit';
  onSuggestionClick: (word: Word) => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchState,
  mode,
  onSuggestionClick,
}) => {
  if (!searchState.showSuggestions) {
    return null;
  }

  return (
    <div className='mt-2'>
      <div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/20'>
        <div className='flex items-start'>
          <svg
            className='mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
            />
          </svg>
          <div className='flex-1'>
            <p className='mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200'>
              Similar words found
            </p>
            <div className='space-y-1'>
              {searchState.suggestions.map(suggestedWord =>
                mode === 'create' ? (
                  <button
                    key={suggestedWord.id}
                    type='button'
                    onClick={() => onSuggestionClick(suggestedWord)}
                    className='block w-full rounded px-2 py-1 text-left text-sm text-blue-600 transition-colors hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-400 dark:hover:bg-yellow-800/30'
                  >
                    {suggestedWord.word}
                  </button>
                ) : (
                  <div
                    key={suggestedWord.id}
                    className='px-2 py-1 text-sm text-gray-700 dark:text-gray-300'
                  >
                    {suggestedWord.word}
                  </div>
                ),
              )}
            </div>
            {searchState.isLoading && (
              <div className='mt-2 flex items-center'>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-yellow-600'></div>
                <span className='text-sm text-yellow-700 dark:text-yellow-300'>
                  Searching for similar words...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

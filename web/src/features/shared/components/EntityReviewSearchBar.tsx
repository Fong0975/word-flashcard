import React, { ReactNode } from 'react';

interface EntityReviewSearchBarProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (event: React.CompositionEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder: string;
  quickFiltersContent?: ReactNode;
}

export const EntityReviewSearchBar: React.FC<EntityReviewSearchBarProps> = ({
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onClear,
  placeholder,
  quickFiltersContent,
}) => (
  <div className='mb-6'>
    <div className='relative'>
      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
        <svg
          className='text-subtle h-5 w-5'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </div>
      <input
        type='text'
        value={value}
        onChange={onChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        className='glass-panel block w-full rounded-md py-2 pl-10 pr-8 leading-5 text-gray-900 placeholder-gray-500 focus:border-primary-400/70 focus:outline-none focus:ring-2 focus:ring-primary-400/30 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400/50 dark:focus:ring-primary-400/20 sm:text-sm'
        placeholder={placeholder}
      />
      {value && (
        <button
          type='button'
          onClick={onClear}
          className='focus-ring text-supporting absolute inset-y-0 right-0 flex items-center rounded-md pr-3 hover:text-gray-900 focus-visible:text-gray-900 dark:hover:text-gray-200 dark:focus-visible:text-gray-200'
          aria-label='Clear search'
        >
          <svg
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      )}
    </div>
    {quickFiltersContent && <div className='mt-2'>{quickFiltersContent}</div>}
  </div>
);

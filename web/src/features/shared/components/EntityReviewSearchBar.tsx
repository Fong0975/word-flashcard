import React, { ReactNode } from 'react';

interface EntityReviewSearchBarProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (event: React.CompositionEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder: string;
  quickFiltersContent?: ReactNode;
  /** When provided, a '+' button is rendered to the left of the clear button. */
  onAdd?: () => void;
  addLabel?: string;
}

const ICON_BUTTON_CLASS =
  'focus-ring flex h-6 w-6 items-center justify-center rounded-md hover:text-gray-900 focus-visible:text-gray-900 dark:hover:text-gray-200 dark:focus-visible:text-gray-200';

export const EntityReviewSearchBar: React.FC<EntityReviewSearchBarProps> = ({
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onClear,
  placeholder,
  quickFiltersContent,
  onAdd,
  addLabel = 'Add from search',
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
        className={`glass-panel block w-full rounded-md py-2 pl-10 ${onAdd ? 'pr-16' : 'pr-8'} leading-5 text-gray-900 placeholder-gray-500 focus:border-primary-400/70 focus:outline-none focus:ring-2 focus:ring-primary-400/30 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400/50 dark:focus:ring-primary-400/20 sm:text-sm`}
        placeholder={placeholder}
      />
      {value && (
        <div className='absolute inset-y-0 right-0 flex items-center gap-1 pr-3'>
          {onAdd && (
            <button
              type='button'
              onClick={onAdd}
              className={`${ICON_BUTTON_CLASS} text-primary-600 dark:text-primary-300`}
              aria-label={addLabel}
              title={addLabel}
            >
              <svg
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 4.5v15m7.5-7.5h-15'
                />
              </svg>
            </button>
          )}
          <button
            type='button'
            onClick={onClear}
            className={`${ICON_BUTTON_CLASS} text-supporting`}
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
        </div>
      )}
    </div>
    {quickFiltersContent && <div className='mt-2'>{quickFiltersContent}</div>}
  </div>
);

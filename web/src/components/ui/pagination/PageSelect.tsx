import React from 'react';

import { DropdownMenu } from '../DropdownMenu';

import { generatePageOptions } from './paginationRange';

interface PageSelectProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export const PageSelect: React.FC<PageSelectProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading,
}) => {
  const pageOptions = generatePageOptions(totalPages);

  return (
    <div className='flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300'>
      <span>Page</span>
      <DropdownMenu
        className='mx-1'
        menuWidthClassName='w-20'
        disabled={loading}
        trigger={
          <button
            type='button'
            disabled={loading}
            aria-label='Select page'
            aria-haspopup='true'
            className='glass-interactive glass-border-subtle flex items-center justify-center gap-1 rounded px-2 py-1 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200'
            style={{ width: 'fit-content', minWidth: '3rem' }}
          >
            {currentPage}
            <svg
              className='h-3.5 w-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>
        }
        items={pageOptions.map(page => ({
          id: String(page),
          label: String(page),
          isSelected: page === currentPage,
          onClick: () => onPageChange(page),
        }))}
      />
      <span>of {totalPages}</span>
    </div>
  );
};

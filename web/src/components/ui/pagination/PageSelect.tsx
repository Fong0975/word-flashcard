import React from 'react';

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
      <select
        value={currentPage}
        onChange={e => onPageChange(Number(e.target.value))}
        disabled={loading}
        className='mx-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
        style={{ width: 'fit-content', minWidth: '3rem' }}
      >
        {pageOptions.map(page => (
          <option key={page} value={page}>
            {page}
          </option>
        ))}
      </select>
      <span>of {totalPages}</span>
    </div>
  );
};

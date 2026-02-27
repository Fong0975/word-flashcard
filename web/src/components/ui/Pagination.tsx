import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  itemsPerPage: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFirst: () => void;
  onLast: () => void;
  loading?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  itemsPerPage,
  totalItems,
  onPageChange,
  onNext,
  onPrevious,
  onFirst,
  onLast,
  loading = false,
  className = '',
}) => {
  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems || currentPage * itemsPerPage,
  );

  // Generate page numbers to show
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning
    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }

    // Adjust if we're near the end
    if (currentPage > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const buttonBaseClass = `
    px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
    border border-gray-300 dark:border-gray-600
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
  `;

  const buttonMobileClass =
    'w-full mx-1 relative inline-flex items-center justify-center';

  const buttonEnabledClass = `
    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
    hover:bg-gray-50 dark:hover:bg-gray-700
    active:bg-gray-100 dark:active:bg-gray-600
  `;

  const buttonDisabledClass = `
    bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500
    cursor-not-allowed opacity-60
  `;

  const buttonActiveClass = `
    bg-primary-500 border-primary-500 text-white
    hover:bg-primary-600
  `;

  return (
    <nav
      className={`flex w-full items-center justify-between ${className}`}
      aria-label='Pagination'
    >
      {/* Mobile section */}
      <div className='flex-1 sm:hidden'>
        {/* Mobile navigation buttons */}
        <div className='mb-2 flex items-center justify-between'>
          <button
            onClick={onFirst}
            disabled={currentPage === 1 || loading}
            className={`${buttonBaseClass} ${buttonMobileClass} ${
              currentPage > 1 && !loading
                ? buttonEnabledClass
                : buttonDisabledClass
            }`}
          >
            <span className='sr-only'>First page</span>
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
                d='M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5'
              />
            </svg>
          </button>
          <button
            onClick={onPrevious}
            disabled={!hasPrevious || loading}
            className={`${buttonBaseClass} ${buttonMobileClass} ${
              hasPrevious && !loading ? buttonEnabledClass : buttonDisabledClass
            }`}
          >
            <span className='sr-only'>Previous</span>
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
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext || loading}
            className={`${buttonBaseClass} ${buttonMobileClass} ${
              hasNext && !loading ? buttonEnabledClass : buttonDisabledClass
            }`}
          >
            <span className='sr-only'>Next</span>
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
                d='M9 5l7 7-7 7'
              />
            </svg>
          </button>
          <button
            onClick={onLast}
            disabled={currentPage === totalPages || loading}
            className={`${buttonBaseClass} ${buttonMobileClass} ${
              currentPage < totalPages && !loading
                ? buttonEnabledClass
                : buttonDisabledClass
            }`}
          >
            <span className='sr-only'>Last page</span>
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
                d='M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5'
              />
            </svg>
          </button>
        </div>
        {/* Mobile page info */}
        <div className='mt-3 flex flex-col items-center justify-center text-sm text-gray-700 dark:text-gray-300'>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          {totalItems && (
            <span className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              ({totalItems} total)
            </span>
          )}
        </div>
      </div>

      {/* Desktop pagination */}
      <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
        <div className='flex-shrink-0'>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            Showing <span className='font-medium'>{startItem}</span> to{' '}
            <span className='font-medium'>{endItem}</span>
            {totalItems && (
              <>
                {' '}
                of <span className='font-medium'>{totalItems}</span>
              </>
            )}{' '}
            results
          </p>
        </div>

        <div className='ml-auto flex-shrink-0'>
          <nav
            className='isolate inline-flex -space-x-px rounded-md shadow-sm'
            aria-label='Pagination'
          >
            {/* First button */}
            <button
              onClick={onFirst}
              disabled={currentPage === 1 || loading}
              className={`relative inline-flex items-center rounded-l-md border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600 ${currentPage > 1 && !loading ? buttonEnabledClass : buttonDisabledClass} `}
            >
              <span className='sr-only'>First page</span>
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
                  d='M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5'
                />
              </svg>
            </button>

            {/* Previous button */}
            <button
              onClick={onPrevious}
              disabled={!hasPrevious || loading}
              className={`relative inline-flex items-center border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600 ${hasPrevious && !loading ? buttonEnabledClass : buttonDisabledClass} `}
            >
              <span className='sr-only'>Previous</span>
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
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>

            {/* Page numbers */}
            {pageNumbers.map(pageNum => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className={`relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 ${
                  pageNum === currentPage
                    ? buttonActiveClass
                    : loading
                      ? buttonDisabledClass
                      : buttonEnabledClass
                } `}
                aria-current={pageNum === currentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            ))}

            {/* Show ellipsis if there are more pages */}
            {totalPages > pageNumbers[pageNumbers.length - 1] && (
              <span className='relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'>
                ...
              </span>
            )}

            {/* Next button */}
            <button
              onClick={onNext}
              disabled={!hasNext || loading}
              className={`relative inline-flex items-center border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600 ${hasNext && !loading ? buttonEnabledClass : buttonDisabledClass} `}
            >
              <span className='sr-only'>Next</span>
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
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </button>

            {/* Last button */}
            <button
              onClick={onLast}
              disabled={currentPage === totalPages || loading}
              className={`relative inline-flex items-center rounded-r-md border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600 ${currentPage < totalPages && !loading ? buttonEnabledClass : buttonDisabledClass} `}
            >
              <span className='sr-only'>Last page</span>
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
                  d='M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5'
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
};

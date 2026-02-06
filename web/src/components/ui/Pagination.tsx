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
  loading = false,
  className = '',
}) => {
  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

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
    <nav className={`flex items-center justify-between ${className}`} aria-label="Pagination">
      {/* Info section */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious || loading}
          className={`${buttonBaseClass} ${
            hasPrevious && !loading ? buttonEnabledClass : buttonDisabledClass
          }`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={!hasNext || loading}
          className={`${buttonBaseClass} ${
            hasNext && !loading ? buttonEnabledClass : buttonDisabledClass
          }`}
        >
          Next
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing{' '}
            <span className="font-medium">{startItem}</span>
            {' '}to{' '}
            <span className="font-medium">{endItem}</span>
            {totalItems && (
              <>
                {' '}of{' '}
                <span className="font-medium">{totalItems}</span>
              </>
            )}
            {' '}results
          </p>
        </div>

        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={onPrevious}
              disabled={!hasPrevious || loading}
              className={`
                relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium
                border border-gray-300 dark:border-gray-600
                ${hasPrevious && !loading ? buttonEnabledClass : buttonDisabledClass}
              `}
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className={`
                  relative inline-flex items-center px-4 py-2 text-sm font-medium
                  border border-gray-300 dark:border-gray-600
                  ${pageNum === currentPage
                    ? buttonActiveClass
                    : loading
                    ? buttonDisabledClass
                    : buttonEnabledClass
                  }
                `}
                aria-current={pageNum === currentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            ))}

            {/* Show ellipsis if there are more pages */}
            {totalPages > pageNumbers[pageNumbers.length - 1] && (
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                ...
              </span>
            )}

            {/* Next button */}
            <button
              onClick={onNext}
              disabled={!hasNext || loading}
              className={`
                relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium
                border border-gray-300 dark:border-gray-600
                ${hasNext && !loading ? buttonEnabledClass : buttonDisabledClass}
              `}
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
};
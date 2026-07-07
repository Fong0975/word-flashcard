import React from 'react';

import { getPageNumbers } from './pagination/paginationRange';
import { PageSelect } from './pagination/PageSelect';
import { PaginationNavButton } from './pagination/PaginationNavButton';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
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
  onPageChange,
  onNext,
  onPrevious,
  onFirst,
  onLast,
  loading = false,
  className = '',
}) => {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const canGoFirst = currentPage > 1 && !loading;
  const canGoPrevious = hasPrevious && !loading;
  const canGoNext = hasNext && !loading;
  const canGoLast = currentPage < totalPages && !loading;

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
          <PaginationNavButton
            type='first'
            layout='mobile'
            isEnabled={canGoFirst}
            onClick={onFirst}
          />
          <PaginationNavButton
            type='previous'
            layout='mobile'
            isEnabled={canGoPrevious}
            onClick={onPrevious}
          />
          <PaginationNavButton
            type='next'
            layout='mobile'
            isEnabled={canGoNext}
            onClick={onNext}
          />
          <PaginationNavButton
            type='last'
            layout='mobile'
            isEnabled={canGoLast}
            onClick={onLast}
          />
        </div>
        {/* Mobile page info */}
        <div className='mt-3 flex flex-col items-center justify-center'>
          <PageSelect
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
          />
        </div>
      </div>

      {/* Desktop pagination */}
      <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
        <div className='flex-shrink-0'>
          <PageSelect
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
          />
        </div>

        <div className='ml-auto flex-shrink-0'>
          <nav
            className='isolate inline-flex -space-x-px rounded-md shadow-sm'
            aria-label='Pagination'
          >
            <PaginationNavButton
              type='first'
              layout='desktop'
              isEnabled={canGoFirst}
              onClick={onFirst}
            />
            <PaginationNavButton
              type='previous'
              layout='desktop'
              isEnabled={canGoPrevious}
              onClick={onPrevious}
            />

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

            <PaginationNavButton
              type='next'
              layout='desktop'
              isEnabled={canGoNext}
              onClick={onNext}
            />
            <PaginationNavButton
              type='last'
              layout='desktop'
              isEnabled={canGoLast}
              onClick={onLast}
            />
          </nav>
        </div>
      </div>
    </nav>
  );
};

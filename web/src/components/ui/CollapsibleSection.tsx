import React from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Generic collapsible section shell with a toggle header and animated chevron.
 * Renders `children` only while expanded; callers own the open/closed state.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className='overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40'
      >
        <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
          {title}
        </h2>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? 'rotate-180 transform' : ''
          }`}
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>

      {isOpen && (
        <div className='border-t border-gray-200 p-4 dark:border-gray-700'>
          {children}
        </div>
      )}
    </div>
  );
};

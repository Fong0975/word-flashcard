import React from 'react';

interface QuickFilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  /** When provided, a colored dot is always shown (e.g. familiarity indicators). */
  dotClassName?: string;
}

export const QuickFilterButton: React.FC<QuickFilterButtonProps> = ({
  label,
  isActive,
  onClick,
  dotClassName,
}) => {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
        isActive
          ? 'bg-primary-500 text-white hover:bg-primary-600'
          : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {dotClassName ? (
        <span
          className={`mr-1.5 h-2 w-2 shrink-0 rounded-full ${dotClassName}`}
        />
      ) : (
        isActive && (
          <svg
            className='mr-1.5 h-3 w-3 shrink-0'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
              clipRule='evenodd'
            />
          </svg>
        )
      )}
      {label}
    </button>
  );
};

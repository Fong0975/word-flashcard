import React from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /**
   * SVG path (24x24 outline, drawn with `stroke='currentColor'`) of a
   * decorative icon shown before the title to help tell sections apart.
   */
  iconPath?: string;
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
  iconPath,
}) => {
  return (
    <div className='glass-panel-card overflow-hidden rounded-lg'>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className='focus-ring flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100/80 focus-visible:bg-gray-100/80 focus-visible:ring-inset dark:hover:bg-gray-800/70 dark:focus-visible:bg-gray-800/70'
      >
        <span className='flex min-w-0 items-center gap-2'>
          {iconPath && (
            <svg
              className='h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
              aria-hidden='true'
              data-testid='collapsible-section-icon'
            >
              <path strokeLinecap='round' strokeLinejoin='round' d={iconPath} />
            </svg>
          )}
          <h2 className='text-left text-lg font-semibold text-gray-800 dark:text-gray-200'>
            {title}
          </h2>
        </span>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
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

import React from 'react';

type NavButtonType = 'first' | 'previous' | 'next' | 'last';

interface PaginationNavButtonProps {
  type: NavButtonType;
  layout: 'mobile' | 'desktop';
  isEnabled: boolean;
  onClick: () => void;
}

const ICON_PATHS: Record<NavButtonType, string> = {
  first: 'M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5',
  previous: 'M15 19l-7-7 7-7',
  next: 'M9 5l7 7-7 7',
  last: 'M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5',
};

const SR_LABELS: Record<NavButtonType, string> = {
  first: 'First page',
  previous: 'Previous',
  next: 'Next',
  last: 'Last page',
};

const DESKTOP_ROUNDED_CLASS: Partial<Record<NavButtonType, string>> = {
  first: 'rounded-l-md',
  last: 'rounded-r-md',
};

const mobileBaseClass = `
  px-3 py-2 text-sm font-medium rounded-md
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
  w-full mx-1 relative inline-flex items-center justify-center
`;

// Desktop nav buttons sit edge-to-edge in a connected segmented bar
// (see Pagination.tsx's `-space-x-px`), so the border must stay visible at
// rest to delineate each button; only the fill is toned down to glass.
const desktopBaseClass =
  'relative inline-flex items-center border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600';

// Mobile nav buttons are standalone (not edge-to-edge), so they can go fully
// transparent at rest and reveal the glass surface on hover/focus/active.
const mobileEnabledClass = 'glass-interactive text-gray-700 dark:text-gray-200';

const desktopEnabledClass = `
  bg-transparent text-gray-700 dark:text-gray-200 transition-colors duration-200
  hover:bg-gray-100/60 hover:backdrop-blur-md dark:hover:bg-gray-800/50
  active:bg-gray-200/70 dark:active:bg-gray-700/70
`;

const mobileDisabledClass =
  'glass-panel text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60';

// Same fill and blur as `.glass-panel`, but without its border/shadow so the
// segmented bar keeps its own visible per-button border.
const desktopDisabledClass = `
  bg-white/10 dark:bg-gray-800/20 backdrop-blur-lg
  text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60
`;

// Shared First/Previous/Next/Last pagination button, used for both the
// mobile and desktop layouts, which only differ in their base/rounding classes.
export const PaginationNavButton: React.FC<PaginationNavButtonProps> = ({
  type,
  layout,
  isEnabled,
  onClick,
}) => {
  const baseClass =
    layout === 'mobile'
      ? mobileBaseClass
      : `${desktopBaseClass} ${DESKTOP_ROUNDED_CLASS[type] || ''}`;
  const enabledClass =
    layout === 'mobile' ? mobileEnabledClass : desktopEnabledClass;
  const disabledClass =
    layout === 'mobile' ? mobileDisabledClass : desktopDisabledClass;

  return (
    <button
      onClick={onClick}
      disabled={!isEnabled}
      className={`${baseClass} ${isEnabled ? enabledClass : disabledClass}`}
    >
      <span className='sr-only'>{SR_LABELS[type]}</span>
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
          d={ICON_PATHS[type]}
        />
      </svg>
    </button>
  );
};

import React from 'react';

/**
 * Right-pointing triangle marking a Symbols group. When the submenu expands
 * inline (phone widths) it rotates to point down while open.
 */
export const SymbolsMenuChevron: React.FC<{
  isExpanded: boolean;
  isInline: boolean;
}> = ({ isExpanded, isInline }) => (
  <svg
    aria-hidden='true'
    viewBox='0 0 20 20'
    fill='currentColor'
    className={`ml-2 h-3 w-3 shrink-0 transition-transform motion-reduce:transition-none ${
      isInline && isExpanded ? 'rotate-90' : ''
    }`}
  >
    <path d='M6 4l9 6-9 6V4z' />
  </svg>
);

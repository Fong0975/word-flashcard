import React from 'react';

/**
 * Decorative backdrop shared by every page shell, so the glass panels layered
 * on top of it (backdrop-blur surfaces) have color and shape to show through
 * in both light and dark theme. The gradients are defined as the
 * `glass-backdrop` background images in `tailwind.config.js`.
 */
export const PageBackground: React.FC = () => (
  <div
    className='fixed inset-0 -z-10 bg-gray-100 bg-glass-backdrop dark:bg-gray-950 dark:bg-glass-backdrop-dark'
    aria-hidden='true'
  />
);

import React from 'react';

/**
 * Decorative blurred gradient backdrop shared by every page shell, so the
 * glass panels layered on top of it (backdrop-blur surfaces) have color to
 * show through in both light and dark theme.
 */
export const PageBackground: React.FC = () => (
  <div
    className='fixed inset-0 -z-10 overflow-hidden bg-gray-100 dark:bg-gray-950'
    aria-hidden='true'
  >
    <div className='absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary-300/70 blur-3xl dark:bg-primary-600/40' />
    <div className='absolute -right-40 -top-24 h-[36rem] w-[36rem] rounded-full bg-primary-300/70 blur-3xl dark:bg-primary-800/50' />
    <div className='absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-primary-200/80 blur-3xl dark:bg-primary-900/50' />
    <div className='absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-gray-400/60 blur-3xl dark:bg-gray-700/40' />
    {/* The corner blobs above leave the viewport center bare, so a tall centered
        overlay (e.g. a large modal) has no color behind it to reveal its glass
        effect; this one fills that gap without dominating the page. */}
    <div className='absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-700/30' />
  </div>
);

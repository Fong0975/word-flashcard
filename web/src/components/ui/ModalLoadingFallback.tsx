import React from 'react';

import { LoadingSpinner } from './LoadingSpinner';

/**
 * `Suspense` fallback for lazily-loaded modal content (e.g. code-split
 * chart libraries). Mimics the backdrop + centered card look of `Modal`
 * so the loading state doesn't flash as a layout shift once the real
 * modal mounts.
 */
export const ModalLoadingFallback: React.FC = () => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
    <div className='glass-panel-strong rounded-lg px-6 shadow-xl'>
      <LoadingSpinner />
    </div>
  </div>
);

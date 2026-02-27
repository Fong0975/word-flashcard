import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className='py-8 text-center'>
      <div className='mb-4 text-6xl'>📝</div>
      <p className='text-gray-600 dark:text-gray-300'>
        No definitions available for this word yet.
      </p>
    </div>
  );
};

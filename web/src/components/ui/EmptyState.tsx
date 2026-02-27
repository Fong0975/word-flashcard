import React from 'react';

interface EmptyStateProps {
  onRefresh: () => void;
  icon?: string;
  title?: string;
  description?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onRefresh,
  icon = '📚',
  title = 'No data found',
  description = 'It looks like there are no items in your collection yet. Try adding some items or check your connection.',
  className = '',
}) => (
  <div className={`py-12 text-center ${className}`}>
    <div className='mb-4 text-6xl'>{icon}</div>
    <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
      {title}
    </h3>
    <p className='mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-300'>
      {description}
    </p>
  </div>
);

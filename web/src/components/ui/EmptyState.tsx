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
  className = ''
}) => (
  <div className={`text-center py-12 ${className}`}>
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
      {description}
    </p>
  </div>
);
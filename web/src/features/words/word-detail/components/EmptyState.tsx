import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">📝</div>
      <p className="text-gray-600 dark:text-gray-300">
        No definitions available for this word yet.
      </p>
    </div>
  );
};
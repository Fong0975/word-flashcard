import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  className = '',
}) => (
  <div className={`flex items-center justify-center py-8 ${className}`}>
    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500'></div>
    <span className='ml-3 text-gray-600 dark:text-gray-400'>{message}</span>
  </div>
);

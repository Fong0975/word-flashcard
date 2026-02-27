import React from 'react';

interface ErrorMessageProps {
  error: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) {
    return null;
  }

  return (
    <div className='rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/20'>
      <div className='flex items-center'>
        <svg
          className='mr-2 h-5 w-5 text-red-400'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
          />
        </svg>
        <span className='text-sm text-red-800 dark:text-red-200'>{error}</span>
      </div>
    </div>
  );
};

import React from 'react';

interface QuizErrorScreenProps {
  error: string;
  onRetry: () => void;
  onBackToHome: () => void;
}

export const QuizErrorScreen: React.FC<QuizErrorScreenProps> = ({
  error,
  onRetry,
  onBackToHome,
}) => (
  <div className='flex flex-1 flex-col items-center justify-center text-center'>
    <div className='mb-4 text-6xl'>❌</div>
    <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
      Error
    </h3>
    <p className='mb-6 text-gray-600 dark:text-gray-300'>{error}</p>
    <div className='flex justify-center gap-3'>
      <button
        onClick={onRetry}
        className='rounded-md bg-primary-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600'
      >
        Try Again
      </button>
      <button
        onClick={onBackToHome}
        className='rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      >
        Back to Home
      </button>
    </div>
  </div>
);

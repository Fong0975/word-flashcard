import React from 'react';

export const QuizLoadingScreen: React.FC = () => (
  <div className='mx-auto max-w-2xl py-12 text-center'>
    <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500'></div>
    <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
      Loading Quiz
    </h3>
    <p className='text-gray-600 dark:text-gray-300'>
      Preparing your quiz questions...
    </p>
  </div>
);

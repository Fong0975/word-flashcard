import React from 'react';

interface QuizResultsFooterProps {
  onRetakeQuiz: () => void;
  onBackToHome: () => void;
}

export const QuizResultsFooter: React.FC<QuizResultsFooterProps> = ({
  onRetakeQuiz,
  onBackToHome,
}) => (
  <div className='flex justify-center space-x-4'>
    <button
      onClick={onRetakeQuiz}
      className='flex w-full items-center justify-center space-x-2 rounded-md bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    >
      <svg
        className='h-4 w-4'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth='2'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
        />
      </svg>
      <span>Again</span>
    </button>

    <button
      onClick={onBackToHome}
      className='flex w-full items-center justify-center space-x-2 rounded-md bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
    >
      <svg
        className='h-4 w-4'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth='2'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
        />
      </svg>
      <span>Home</span>
    </button>
  </div>
);

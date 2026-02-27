import React from 'react';

import { WordQuizResult } from '../../../types/api';

interface WordQuizResultsProps {
  results: WordQuizResult[];
  onRetakeQuiz: () => void;
  onBackToHome: () => void;
}

const getFamiliarityColor = (familiarity: string) => {
  switch (familiarity.toLowerCase()) {
    case 'green':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-200',
        dot: 'bg-green-500',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-200',
        dot: 'bg-yellow-500',
      };
    case 'red':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        dot: 'bg-red-500',
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-800 dark:text-gray-200',
        dot: 'bg-gray-500',
      };
  }
};

const FamiliarityBadge: React.FC<{ familiarity: string }> = ({
  familiarity,
}) => {
  const colors = getFamiliarityColor(familiarity);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <div className={`h-2 w-2 ${colors.dot} mr-1 rounded-full`}></div>
      {familiarity.charAt(0).toUpperCase() + familiarity.slice(1)}
    </span>
  );
};

export const WordQuizResults: React.FC<WordQuizResultsProps> = ({
  results,
  onRetakeQuiz,
  onBackToHome,
}) => {
  const totalQuestions = results.length;
  const levels: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  const { improvementCount, stayCount, worsenedCount } = results.reduce(
    (acc, result) => {
      const oldLevel = levels[result.oldFamiliarity];
      const newLevel = levels[result.newFamiliarity];

      if (newLevel > oldLevel) {
        acc.improvementCount++;
      } else if (newLevel === oldLevel) {
        acc.stayCount++;
      } else {
        acc.worsenedCount++;
      }

      return acc;
    },
    { improvementCount: 0, stayCount: 0, worsenedCount: 0 },
  );

  return (
    <div className='mx-auto max-w-4xl pt-8'>
      {/* Header */}
      <div className='mb-8 text-center'>
        <div className='mb-4 text-6xl'>🎉</div>
        <h1 className='mb-2 text-xl font-bold text-gray-900 dark:text-white lg:text-3xl'>
          Quiz Complete!
        </h1>
        <p className='text-gray-600 dark:text-gray-300 lg:text-lg'>
          Great job! Here's a summary of your quiz results.
        </p>
      </div>

      {/* Summary */}
      <div className='mb-8 mt-4 grid grid-cols-1 gap-4 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800'>
        {/* Total Number */}
        <div className='text-center text-6xl font-bold text-gray-500 dark:text-gray-300'>
          {totalQuestions}
        </div>

        {/* Statistics */}
        <div className='mt-1 grid grid-cols-3 gap-6 border-t border-gray-200 pt-4 dark:border-gray-700'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {improvementCount}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              Improved
            </div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
              {stayCount}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              Stayed
            </div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
              {worsenedCount}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              Worsed
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className='mb-8 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
        <div className='border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Quiz Results ({totalQuestions} words)
          </h2>
        </div>

        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {/* Quiz Result - Word List */}
          {results.map((result, index) => (
            <div key={result.word.id} className='px-2 py-4 md:px-3 lg:px-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <div className='flex-shrink-0'>
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400 md:h-10 md:w-10'>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                      {result.word.word}
                    </h3>
                    {result.word.definitions &&
                      result.word.definitions.length > 0 && (
                        <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
                          {result.word.definitions[0].definition}
                        </p>
                      )}
                  </div>
                </div>

                <div className='flex flex-col items-center space-y-2'>
                  <FamiliarityBadge familiarity={result.oldFamiliarity} />

                  <div className='text-gray-400 dark:text-gray-600'>to</div>

                  <FamiliarityBadge familiarity={result.newFamiliarity} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
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
    </div>
  );
};

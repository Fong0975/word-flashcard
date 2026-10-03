import React from 'react';

import { ShuffledOption } from '../types';

interface AnswerReviewListProps {
  options: ShuffledOption[];
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export const AnswerReviewList: React.FC<AnswerReviewListProps> = ({
  options,
  selectedAnswer,
  correctAnswer,
  isCorrect,
}) => (
  <div className='mb-6 space-y-2'>
    {options.map(option => {
      const isUserWrongAnswer = option.key === selectedAnswer && !isCorrect;
      return (
        <div
          key={option.key}
          className={`flex items-start space-x-3 rounded-lg p-3 ${
            option.key === correctAnswer
              ? 'border border-green-400/50 bg-green-500/15 dark:border-green-400/30 dark:bg-green-400/10'
              : isUserWrongAnswer
                ? 'border border-red-400/50 bg-red-500/15 dark:border-red-400/30 dark:bg-red-400/10'
                : 'glass-panel-card'
          }`}
        >
          <span
            className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
              option.key === correctAnswer
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : isUserWrongAnswer
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
            }`}
          >
            {option.key}
          </span>
          <span className='flex-1 leading-relaxed text-gray-700 dark:text-gray-300'>
            {option.value}
            {option.key === correctAnswer && (
              <span className='ml-2 font-medium text-green-600 dark:text-green-400'>
                ✓ Correct
              </span>
            )}
            {isUserWrongAnswer && (
              <span className='ml-2 font-medium text-red-600 dark:text-red-400'>
                ✗ Your Answer
              </span>
            )}
          </span>
        </div>
      );
    })}
  </div>
);

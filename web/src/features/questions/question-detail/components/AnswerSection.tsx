import React from 'react';

import { MarkdownContent } from '../../../../components/ui';
import { AnswerSectionProps } from '../types/question-detail';

export const AnswerSection: React.FC<AnswerSectionProps> = ({
  isExpanded,
  onToggle,
  answer,
  explanation,
  question,
}) => {
  // Get the content of the correct answer option
  const getCorrectAnswerContent = () => {
    switch (answer.toUpperCase()) {
      case 'A':
        return question.option_a;
      case 'B':
        return question.option_b;
      case 'C':
        return question.option_c;
      case 'D':
        return question.option_d;
      default:
        return null;
    }
  };

  const correctAnswerContent = getCorrectAnswerContent();
  return (
    <div className='overflow-hidden rounded-lg border border-yellow-300/60 bg-yellow-100/50 backdrop-blur-lg dark:border-yellow-700/40 dark:bg-yellow-900/30'>
      {/* Collapsible Header */}
      <button
        onClick={onToggle}
        className='focus-ring-warning flex w-full items-center justify-between p-4 transition-colors hover:bg-yellow-200/50 focus-visible:bg-yellow-200/50 focus-visible:ring-inset dark:hover:bg-yellow-800/30 dark:focus-visible:bg-yellow-800/30'
      >
        <h2 className='text-lg font-semibold text-yellow-800 dark:text-yellow-200'>
          Answer & Explanation
        </h2>
        <svg
          className={`h-5 w-5 text-yellow-600 transition-transform duration-200 dark:text-yellow-300 ${
            isExpanded ? 'rotate-180 transform' : ''
          }`}
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>

      {/* Expanded Content - Lighter background */}
      {isExpanded && (
        <div className='glass-panel-card border-t-yellow-300/60 dark:border-t-yellow-700/40'>
          {/* Correct Answer Section */}
          <div className='border-b border-gray-200 p-4 dark:border-gray-700'>
            <h3 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Correct Answer:
            </h3>
            <div className='flex items-start space-x-3'>
              {/* Answer Letter Badge */}
              <span className='inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900 dark:text-green-300'>
                {answer.toUpperCase()}
              </span>
              {/* Answer Content */}
              <div className='flex-1'>
                <div className='text-base font-medium leading-relaxed text-gray-900 dark:text-gray-100'>
                  {correctAnswerContent || 'Answer content not found'}
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Section */}
          {explanation && (
            <div className='p-4'>
              <h3 className='mb-2 border-b border-gray-200/40 pb-1 text-sm font-medium text-gray-900 dark:border-gray-700/40 dark:text-white'>
                Explanation
              </h3>
              <MarkdownContent content={explanation} variant='notes' />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

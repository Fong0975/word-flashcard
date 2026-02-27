import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

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
    <div className='overflow-hidden rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'>
      {/* Collapsible Header */}
      <button
        onClick={onToggle}
        className='flex w-full items-center justify-between p-4 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
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
        <div className='border-t border-yellow-200 bg-white dark:border-yellow-800 dark:bg-gray-800'>
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
              <h3 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
                Explanation:
              </h3>
              <div className='prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-700 dark:prose-p:text-gray-300'>
                <div className='prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-700 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-600 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-300 dark:prose-code:bg-gray-700 dark:prose-code:text-pink-400'>
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                    {explanation.replace(/\\n/g, '\n')}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

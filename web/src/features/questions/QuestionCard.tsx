import React from 'react';

import { Question } from '../../types/api';
import { EntityCard } from '../shared/components/EntityCard';
import { getAccuracyRateColor } from '../shared/constants/quiz';

interface QuestionCardProps {
  index: number;
  question: Question;
  className?: string;
  onQuestionUpdated?: () => void;
  onClick?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  index,
  question,
  className = '',
  onQuestionUpdated,
  onClick,
}) => {
  // Handle card click
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };
  // Get available options (filter out empty options)
  const getAvailableOptions = () => {
    const options = [];
    if (question.option_a) {
      options.push({ key: 'A', value: question.option_a });
    }
    if (question.option_b) {
      options.push({ key: 'B', value: question.option_b });
    }
    if (question.option_c) {
      options.push({ key: 'C', value: question.option_c });
    }
    if (question.option_d) {
      options.push({ key: 'D', value: question.option_d });
    }
    return options;
  };

  // Calculate accuracy rate
  const getAccuracyRate = () => {
    if (question.count_practise === 0) {
      return 0;
    }
    const successCount =
      question.count_practise - question.count_failure_practise;
    return Math.round((successCount / question.count_practise) * 100);
  };

  const availableOptions = getAvailableOptions();
  const accuracyRate = getAccuracyRate();

  return (
    <EntityCard
      index={index}
      entity={question}
      config={{
        showSequence: false, // We'll handle the sequence ourselves
        sequenceStyle: 'detailed',
        showLeftIndicator: false,
        showRightArrow: false, // We'll handle the arrow ourselves
      }}
      actions={{
        onClick: handleCardClick,
        onEntityUpdated: onQuestionUpdated,
      }}
      renderContent={question => (
        <div className='w-full'>
          {/* Header Row: Index on left, arrow on right */}
          <div className='mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700'>
            {/* Index Number */}
            <div className='flex items-center'>
              <span className='mr-1 text-xs font-bold uppercase tracking-tighter text-primary-500 opacity-70 dark:text-primary-400'>
                No.
              </span>
              <span className='font-mono text-base font-bold tabular-nums text-gray-400 transition-colors group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-400'>
                {index}
              </span>
            </div>

            {/* Enter Detail Arrow */}
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </div>
          </div>

          {/* Question Content - Full Width */}
          <div className='mb-4'>
            <h3 className='text-lg font-semibold leading-relaxed text-gray-900 dark:text-white'>
              {question.question}
            </h3>
          </div>

          {/* Options - Responsive Layout */}
          <div className='mb-4'>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
              {availableOptions.map(option => (
                <div
                  key={option.key}
                  className='flex items-start space-x-2 rounded-md bg-gray-50 p-2 text-sm dark:bg-gray-700/50'
                >
                  <span className='mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                    {option.key}
                  </span>
                  <span className='leading-relaxed text-gray-600 dark:text-gray-300'>
                    {option.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className='flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700'>
            {/* Practice count */}
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Practices:{' '}
              <span className='font-medium text-gray-700 dark:text-gray-300'>
                {question.count_practise}
              </span>
              {question.count_failure_practise > 0 && (
                <span className='ms-2 text-xs'>
                  / Errors: {question.count_failure_practise}
                </span>
              )}
            </div>

            {/* Accuracy rate */}
            {question.count_practise > 0 && (
              <div
                className={`rounded-full px-2 py-1 text-xs font-medium ${getAccuracyRateColor(accuracyRate)}`}
              >
                Accuracy {accuracyRate}%
              </div>
            )}

            {/* No practice indicator */}
            {question.count_practise === 0 && (
              <div className='rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400'>
                No Practice
              </div>
            )}
          </div>
        </div>
      )}
      className={className}
    />
  );
};

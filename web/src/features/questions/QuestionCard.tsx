import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Question } from '../../types/api';
import { EntityCard } from '../shared/components/EntityCard';
import { getAccuracyTextColor } from '../shared/constants/quiz';

import { AccuracyBar } from './AccuracyBar';
import { calculateAccuracyRate } from './question-detail/utils/accuracyCalculation';
import { getAvailableOptions } from './question-detail/utils/optionHelpers';

interface QuestionCardProps {
  index: number;
  question: Question;
  className?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  index,
  question,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/question/${question.id}`);
  };

  const availableOptions = getAvailableOptions(question);
  const accuracyRate = calculateAccuracyRate(
    question.count_practise,
    question.count_failure_practise,
  );
  const isPracticed = question.count_practise > 0;
  const statsTextColor = isPracticed
    ? getAccuracyTextColor(accuracyRate)
    : 'text-supporting';

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
      }}
      renderContent={question => (
        <div className='w-full pb-1'>
          {/* Header Row: Index on left, arrow on right */}
          <div className='mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700'>
            {/* Index Number. The label and the number differ in font family and
                size, so centering their line boxes leaves the glyphs a pixel or
                two apart. Trimming each box to its cap height makes
                `items-center` center the glyphs themselves, in line with the
                arrow. Browsers without `text-box` keep the line-box centering. */}
            <div className='flex items-center'>
              <span className='mr-1 text-xs font-bold uppercase tracking-tighter text-primary-700 [text-box:trim-both_cap_alphabetic] dark:text-primary-400'>
                No.
              </span>
              <span className='text-supporting font-mono text-base font-bold tabular-nums transition-colors [text-box:trim-both_cap_alphabetic] group-hover:text-primary-600 dark:group-hover:text-primary-400'>
                {index}
              </span>
            </div>

            {/* Enter Detail Arrow */}
            <div className='flex-shrink-0'>
              <svg
                className='text-subtle h-5 w-5 transition-colors group-hover:text-primary-500 dark:group-hover:text-primary-400'
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
          <div className='mb-8'>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
              {availableOptions.map(option => (
                <div
                  key={option.key}
                  className='flex items-center space-x-2 rounded-md bg-gray-50 p-2 text-sm dark:bg-gray-700/50'
                >
                  <span className='inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
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
          <div
            data-testid='question-stats'
            className={`flex items-center justify-between text-sm ${statsTextColor}`}
          >
            {/* Practice count */}
            <div>
              Practices:{' '}
              <span className='font-medium'>{question.count_practise}</span>
              {question.count_failure_practise > 0 && (
                <span> / Errors: {question.count_failure_practise}</span>
              )}
            </div>

            <div className='font-medium'>
              {isPracticed ? `Accuracy ${accuracyRate}%` : 'No Practice'}
            </div>
          </div>

          {/* Laid over the card's bottom border (hence the -1px insets), with
              the card's own corner radius so the bar follows both bottom
              corners. */}
          <AccuracyBar
            accuracyRate={isPracticed ? accuracyRate : null}
            className='absolute -inset-x-px -bottom-px h-1.5 rounded-b-lg rounded-t-none'
          />
        </div>
      )}
      className={`relative ${className}`}
    />
  );
};

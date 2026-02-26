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
    if (question.option_a) {options.push({ key: 'A', value: question.option_a });}
    if (question.option_b) {options.push({ key: 'B', value: question.option_b });}
    if (question.option_c) {options.push({ key: 'C', value: question.option_c });}
    if (question.option_d) {options.push({ key: 'D', value: question.option_d });}
    return options;
  };

  // Calculate accuracy rate
  const getAccuracyRate = () => {
    if (question.count_practise === 0) {return 0;}
    const successCount = question.count_practise - question.count_failure_practise;
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
      renderContent={(question) => (
        <div className="w-full">
          {/* Header Row: Index on left, arrow on right */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            {/* Index Number */}
            <div className="flex items-center">
              <span className="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-tighter opacity-70 mr-1">
                No.
              </span>
              <span className="text-base font-mono font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tabular-nums">
                {index}
              </span>
            </div>

            {/* Enter Detail Arrow */}
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Question Content - Full Width */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
              {question.question}
            </h3>
          </div>

          {/* Options - Responsive Layout */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {availableOptions.map((option) => (
                <div
                  key={option.key}
                  className="flex items-start space-x-2 text-sm p-2 rounded-md bg-gray-50 dark:bg-gray-700/50"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs flex-shrink-0 mt-0.5">
                    {option.key}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {option.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Practice count */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Practices: <span className="font-medium text-gray-700 dark:text-gray-300">{question.count_practise}</span>
              {question.count_failure_practise > 0 && (
                <span className="ms-2 text-xs">
                  / Errors: {question.count_failure_practise}
                </span>
              )}
            </div>

            {/* Accuracy rate */}
            {question.count_practise > 0 && (
              <div className={`text-xs px-2 py-1 rounded-full font-medium ${getAccuracyRateColor(accuracyRate)}`}>
                Accuracy {accuracyRate}%
              </div>
            )}

            {/* No practice indicator */}
            {question.count_practise === 0 && (
              <div className="text-xs px-2 py-1 rounded-full font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
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
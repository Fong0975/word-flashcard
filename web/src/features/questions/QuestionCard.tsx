import React from 'react';
import { Question } from '../../types/api';

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
  onClick
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
    if (question.option_a) options.push({ key: 'A', value: question.option_a });
    if (question.option_b) options.push({ key: 'B', value: question.option_b });
    if (question.option_c) options.push({ key: 'C', value: question.option_c });
    if (question.option_d) options.push({ key: 'D', value: question.option_d });
    return options;
  };

  // Calculate accuracy rate
  const getAccuracyRate = () => {
    if (question.count_practise === 0) return 0;
    const successCount = question.count_practise - question.count_failure_practise;
    return Math.round((successCount / question.count_practise) * 100);
  };

  // Get accuracy rate color
  const getAccuracyRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  const availableOptions = getAvailableOptions();
  const accuracyRate = getAccuracyRate();

  return (
    <div
      className={`
        group cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600
        transition-all duration-200 ease-in-out
        flex items-start p-4
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Sequence Number Section */}
      <div className="flex-shrink-0 w-12 pt-1 mr-2 border-r border-gray-100 dark:border-gray-700/50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-tighter opacity-70">
            No.
          </span>
          <span className="text-base font-mono font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tabular-nums">
            {index}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Header with question */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
            {question.question}
          </h3>
        </div>

        {/* Options */}
        <div className="mb-4">
          <div className="space-y-2">
            {availableOptions.map((option) => (
              <div
                key={option.key}
                className="flex items-start space-x-2 text-sm"
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

      {/* Right chevron icon */}
      <div className="flex-shrink-0 ml-4">
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
  );
};
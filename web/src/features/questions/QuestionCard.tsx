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


  const availableOptions = getAvailableOptions();
  const accuracyRate = getAccuracyRate();

  return (
    <EntityCard
      index={index}
      entity={question}
      config={{
        showSequence: true,
        sequenceStyle: 'detailed',
        showLeftIndicator: false,
      }}
      actions={{
        onClick: handleCardClick,
        onEntityUpdated: onQuestionUpdated,
      }}
      renderContent={(question) => (
        <div>
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
      )}
      className={className}
    />
  );
};
import React from 'react';

import { QuestionFooterProps } from '../types/question-detail';
import { formatPracticeText } from '../utils/questionFormat';

export const QuestionFooter: React.FC<QuestionFooterProps> = ({ question }) => {
  const practiceText = formatPracticeText(question.count_practise);

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Question ID: {question.id}</span>
        <span>{practiceText}</span>
      </div>
    </div>
  );
};
import React from 'react';
import { CorrectAnswerProps } from '../types/question-detail';

export const CorrectAnswer: React.FC<CorrectAnswerProps> = ({ answer }) => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
      <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
        Correct Answer:
      </h3>
      <div className="text-green-700 dark:text-green-300 font-medium">
        {answer}
      </div>
    </div>
  );
};
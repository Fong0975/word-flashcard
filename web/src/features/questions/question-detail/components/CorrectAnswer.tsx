import React from 'react';

import { CorrectAnswerProps } from '../types/question-detail';

export const CorrectAnswer: React.FC<CorrectAnswerProps> = ({ answer }) => {
  return (
    <div className='rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
      <h3 className='mb-2 text-sm font-medium text-green-800 dark:text-green-200'>
        Correct Answer:
      </h3>
      <div className='font-medium text-green-700 dark:text-green-300'>
        {answer}
      </div>
    </div>
  );
};

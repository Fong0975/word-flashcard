import React from 'react';

import { QuestionHeaderProps } from '../types/question-detail';
import {
  formatQuestionForCopy,
  formatPracticeText,
} from '../utils/questionFormat';

import { QuestionActions } from './QuestionActions';

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  question,
  onEdit,
  onCopy,
  onDelete,
}) => {
  const copyText = formatQuestionForCopy(question);
  const practiceText = formatPracticeText(question.count_practise);

  return (
    <div className='mb-2 border-b border-gray-200 pb-4 dark:border-gray-700 lg:pt-2'>
      {/* Question id and practice */}
      <div className='mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
        <span>Question ID: {question.id}</span>
        <span>{practiceText}</span>
      </div>

      <div>
        {/* Question */}
        <h1 className='font-bold leading-relaxed text-gray-900 dark:text-white lg:text-xl'>
          {question.question}
        </h1>

        {/* Reference */}
        {question.reference && (
          <div className='my-3'>
            <p className='text-sm italic text-gray-500 dark:text-gray-400'>
              Reference: {question.reference}
            </p>
          </div>
        )}
      </div>

      <QuestionActions
        onEdit={onEdit}
        onCopy={onCopy}
        onDelete={onDelete}
        copyText={copyText}
      />
    </div>
  );
};

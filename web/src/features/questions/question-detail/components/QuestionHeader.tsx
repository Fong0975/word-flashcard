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
    <div className='mb-2 border-b border-gray-200 pb-4 lg:pt-2 dark:border-gray-700'>
      {/* Question id and practice */}
      <div className='mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
        <span>Question ID: {question.id}</span>
        <span>{practiceText}</span>
      </div>

      <div>
        {/* Question */}
        <h1 className='leading-relaxed font-bold text-gray-900 lg:text-xl dark:text-white'>
          {question.question}
        </h1>

        {/* Reference */}
        {question.reference && (
          <div className='my-3'>
            <p className='text-sm text-gray-500 italic dark:text-gray-400'>
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

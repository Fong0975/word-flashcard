import React from 'react';

import { QuestionHeaderProps } from '../types/question-detail';
import { formatQuestionForCopy } from '../utils/questionFormat';

import { QuestionActions } from './QuestionActions';

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  question,
  onEdit,
  onCopy,
  onDelete,
}) => {
  const copyText = formatQuestionForCopy(question);

  return (
    <div className='mb-2 border-b border-gray-200 pb-4 pt-6 dark:border-gray-700 lg:pt-4'>
      <div>
        <h1 className='text-xl font-bold leading-relaxed text-gray-900 dark:text-white'>
          {question.question}
        </h1>

        {/* Reference */}
        {question.reference && (
          <div className='mt-3'>
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

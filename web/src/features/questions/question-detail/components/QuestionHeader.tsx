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
    <div className="mb-2 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
          {question.question}
        </h1>

        {/* Reference */}
        {question.reference && (
          <div className="mt-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
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
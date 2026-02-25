import React from 'react';
import { QuestionHeaderProps } from '../types/question-detail';
import { QuestionActions } from './QuestionActions';
import { formatQuestionForCopy } from '../utils/questionFormat';

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  question,
  onEdit,
  onCopy,
  onDelete
}) => {
  const copyText = formatQuestionForCopy(question);

  return (
    <div className="mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
      <div className="mt-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
          {question.question}
        </h1>
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
import React from 'react';
import { AnswerSectionProps } from '../types/question-detail';
import { CorrectAnswer } from './CorrectAnswer';
import { ExplanationContent } from './ExplanationContent';

export const AnswerSection: React.FC<AnswerSectionProps> = ({
  isExpanded,
  onToggle,
  answer,
  explanation
}) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
      >
        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
          Answer & Explanation
        </h2>
        <svg
          className={`w-5 h-5 text-yellow-600 dark:text-yellow-300 transition-transform duration-200 ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <CorrectAnswer answer={answer} />
          {explanation && <ExplanationContent explanation={explanation} />}
        </div>
      )}
    </div>
  );
};
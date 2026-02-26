import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { AnswerSectionProps } from '../types/question-detail';

export const AnswerSection: React.FC<AnswerSectionProps> = ({
  isExpanded,
  onToggle,
  answer,
  explanation,
  question
}) => {
  // Get the content of the correct answer option
  const getCorrectAnswerContent = () => {
    switch (answer.toUpperCase()) {
      case 'A':
        return question.option_a;
      case 'B':
        return question.option_b;
      case 'C':
        return question.option_c;
      case 'D':
        return question.option_d;
      default:
        return null;
    }
  };

  const correctAnswerContent = getCorrectAnswerContent();
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
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

      {/* Expanded Content - Lighter background */}
      {isExpanded && (
        <div className="border-t border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-800">
          {/* Correct Answer Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Correct Answer:
            </h3>
            <div className="flex items-start space-x-3">
              {/* Answer Letter Badge */}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold text-sm flex-shrink-0">
                {answer.toUpperCase()}
              </span>
              {/* Answer Content */}
              <div className="flex-1">
                <div className="text-gray-900 dark:text-gray-100 font-medium text-base leading-relaxed">
                  {correctAnswerContent || 'Answer content not found'}
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Section */}
          {explanation && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Explanation:
              </h3>
              <div className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:text-gray-700 dark:prose-p:text-gray-300">
                <div className="
                  prose prose-sm max-w-none prose-slate dark:prose-invert
                  prose-p:text-gray-700 dark:prose-p:text-gray-300
                  /* 1. Remove the default backticks */
                  prose-code:before:content-none
                  prose-code:after:content-none
                  /* 2. Add special markup styles */
                  prose-code:bg-gray-100 dark:prose-code:bg-gray-700
                  prose-code:text-pink-600 dark:prose-code:text-pink-400
                  prose-code:px-1.5 prose-code:py-0.5
                  prose-code:rounded-md
                  prose-code:font-medium
                ">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                    {explanation.replace(/\\n/g, '\n')}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
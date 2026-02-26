import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { ExplanationContentProps } from '../types/question-detail';

export const ExplanationContent: React.FC<ExplanationContentProps> = ({ explanation }) => {
  if (!explanation) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Explanation:
      </h3>
      <div className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400">
        <div className="
          prose prose-sm max-w-none prose-slate dark:prose-invert
          prose-p:text-gray-600 dark:prose-p:text-gray-400
          /* 1. Remove the default backticks */
          prose-code:before:content-none
          prose-code:after:content-none
          /* 2. Add special markup styles (e.g., gray background, pink text, rounded corners) */
          prose-code:bg-gray-100 dark:prose-code:bg-gray-800
          prose-code:text-pink-500 dark:prose-code:text-pink-400
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
  );
};
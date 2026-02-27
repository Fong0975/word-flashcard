import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { ExplanationContentProps } from '../types/question-detail';

export const ExplanationContent: React.FC<ExplanationContentProps> = ({
  explanation,
}) => {
  if (!explanation) {
    return null;
  }

  return (
    <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
      <h3 className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
        Explanation:
      </h3>
      <div className='prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400'>
        <div className='/* 1. Remove the default backticks */ /* 2. Add special markup styles (e.g., gray background, pink text, corners) */ prose prose-sm prose-slate max-w-none rounded dark:prose-invert prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-400 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400'>
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>
            {explanation.replace(/\\n/g, '\n')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

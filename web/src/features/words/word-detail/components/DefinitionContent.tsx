import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { WordDefinition } from '../../../../types/api';

interface DefinitionContentProps {
  definition: WordDefinition;
}

export const DefinitionContent: React.FC<DefinitionContentProps> = ({ definition }) => {
  return (
    <div className="space-y-2">
      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
        {definition.definition}
      </p>

      {definition.examples && definition.examples.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Examples:
          </h5>
          <ul className="space-y-1">
            {definition.examples.map((example, exampleIndex) => (
              <li
                key={exampleIndex}
                className="text-sm text-gray-600 dark:text-gray-400 italic pl-4 border-l-2 border-gray-300 dark:border-gray-600"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      {definition.notes && (
        <div>
          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Notes:
          </h5>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-ul:text-gray-600 dark:prose-ul:text-gray-400">
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
                {definition.notes.replaceAll(/\\n/g, '\n')}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
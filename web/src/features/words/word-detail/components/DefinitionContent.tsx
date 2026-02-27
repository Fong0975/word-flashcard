import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { WordDefinition } from '../../../../types/api';

interface DefinitionContentProps {
  definition: WordDefinition;
}

export const DefinitionContent: React.FC<DefinitionContentProps> = ({
  definition,
}) => {
  return (
    <div className='space-y-2'>
      <p className='leading-relaxed text-gray-800 dark:text-gray-200'>
        {definition.definition}
      </p>

      {definition.examples && definition.examples.length > 0 && (
        <div>
          <h5 className='mb-2 text-sm font-medium text-gray-600 dark:text-gray-400'>
            Examples:
          </h5>
          <ul className='space-y-1'>
            {definition.examples.map((example, exampleIndex) => (
              <li
                key={exampleIndex}
                className='border-l-2 border-gray-300 pl-4 text-sm italic text-gray-600 dark:border-gray-600 dark:text-gray-400'
              >
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      {definition.notes && (
        <div>
          <h5 className='mb-1 text-sm font-medium text-gray-600 dark:text-gray-400'>
            Notes:
          </h5>
          <div className='prose prose-sm prose-slate max-w-none rounded bg-yellow-50 p-2 dark:prose-invert prose-headings:text-gray-800 prose-p:text-gray-600 prose-ul:text-gray-600 dark:bg-yellow-900/20 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-400 dark:prose-ul:text-gray-400'>
            <div className='prose prose-sm prose-slate max-w-none rounded dark:prose-invert prose-p:text-gray-600 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-pink-500 prose-code:before:content-none prose-code:after:content-none dark:prose-p:text-gray-400 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400'>
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

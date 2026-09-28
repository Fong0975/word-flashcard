import React from 'react';

import { MarkdownContent } from '../../../../components/ui';
import { WordDefinition } from '../../../../types/api';

interface DefinitionContentProps {
  definition: WordDefinition;
}

export const DefinitionContent: React.FC<DefinitionContentProps> = ({
  definition,
}) => {
  return (
    <div className='space-y-4'>
      <p className='leading-relaxed text-gray-800 dark:text-gray-200'>
        {definition.definition}
      </p>

      {definition.examples && definition.examples.length > 0 && (
        <div className='pt-2'>
          <h5 className='mb-2 border-b border-gray-200/40 pb-1 text-sm font-medium text-gray-900 dark:border-gray-700/40 dark:text-white'>
            Examples
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
        <div className='pt-2'>
          <h5 className='mb-3 border-b border-gray-200/40 pb-1 text-sm font-medium text-gray-900 dark:border-gray-700/40 dark:text-white'>
            Notes
          </h5>
          <MarkdownContent
            content={definition.notes}
            variant='notes'
            unescapeLiteralNewlines
          />
        </div>
      )}
    </div>
  );
};

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
          <MarkdownContent
            content={definition.notes}
            variant='boxed-yellow'
            unescapeLiteralNewlines
          />
        </div>
      )}
    </div>
  );
};

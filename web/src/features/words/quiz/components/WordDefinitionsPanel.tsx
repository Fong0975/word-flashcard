import React from 'react';

import { WordDefinition } from '../../../../types/api';
import { MarkdownContent } from '../../../../components/ui/MarkdownContent';

interface WordDefinitionsPanelProps {
  definitions: readonly WordDefinition[];
}

export const WordDefinitionsPanel: React.FC<WordDefinitionsPanelProps> = ({
  definitions,
}) => {
  if (definitions.length === 0) {
    return null;
  }

  return (
    <div className='mb-8 rounded-lg bg-gray-50 p-6 dark:bg-gray-700'>
      <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
        Definitions ({definitions.length})
      </h3>
      <div className='space-y-4'>
        {definitions.map(definition => (
          <div key={definition.id} className='space-y-2'>
            {definition.part_of_speech && (
              <div className='flex-shrink-0'>
                {definition.part_of_speech
                  .split(',')
                  .filter(pos => pos.trim())
                  .map((pos, posIndex) => (
                    <span
                      key={posIndex}
                      className='mr-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    >
                      {pos.trim()}
                    </span>
                  ))}
              </div>
            )}

            <div className='px-1'>
              {/* Definitions */}
              <div className='flex-1'>
                <p className='text-gray-800 dark:text-gray-200'>
                  {definition.definition}
                </p>
              </div>

              {/* Example */}
              {definition.examples && definition.examples.length > 0 && (
                <div className='mt-2'>
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

              {/* Notes */}
              {definition.notes && (
                <div className='mt-2'>
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
          </div>
        ))}
      </div>
    </div>
  );
};

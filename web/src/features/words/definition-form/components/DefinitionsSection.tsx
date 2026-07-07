import React from 'react';

import { CambridgeDefinition } from '../types';

interface DefinitionsSectionProps {
  definitions: CambridgeDefinition[];
  onApplyDefinition: (definition: CambridgeDefinition) => void;
}

export const DefinitionsSection: React.FC<DefinitionsSectionProps> = ({
  definitions,
  onApplyDefinition,
}) => {
  if (!definitions || definitions.length === 0) {
    return null;
  }

  return (
    <div className='mt-3 space-y-3'>
      <h4 className='mb-4 text-base font-medium text-gray-900 dark:text-gray-300'>
        Definitions
      </h4>
      {definitions.map(def => (
        <div
          key={def.id}
          className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'
        >
          <div className='mb-3 flex items-start justify-between'>
            <div className='flex-1'>
              <div className='mb-2 flex items-center space-x-2'>
                <span className='inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-300'>
                  {def.pos}
                </span>
              </div>
              <p className='mb-2 text-sm text-gray-900 dark:text-gray-100'>
                <span className='font-medium'>{def.translation}</span>{' '}
                {def.text}
              </p>
              {def.example && def.example.length > 0 && (
                <div className='space-y-1'>
                  <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    Examples:
                  </p>
                  {def.example.map(example => (
                    <p
                      key={example.id}
                      className='text-xs italic text-gray-600 dark:text-gray-400'
                    >
                      • {example.text} {example.translation}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <button
              type='button'
              onClick={() => onApplyDefinition(def)}
              className='ml-4 flex-shrink-0 rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700'
            >
              Apply
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

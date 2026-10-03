import React from 'react';

import { MarkdownContent } from '../../../../components/ui/MarkdownContent';

interface ReferenceAndExplanationProps {
  reference: string;
  notes: string;
}

export const ReferenceAndExplanation: React.FC<
  ReferenceAndExplanationProps
> = ({ reference, notes }) => (
  <>
    {reference && (
      <div className='mb-6'>
        <h3 className='mb-2 border-b border-gray-200/40 pb-1 text-lg font-semibold text-gray-900 dark:border-gray-700/40 dark:text-white'>
          Reference
        </h3>
        <p className='text-sm text-gray-700 dark:text-gray-300'>{reference}</p>
      </div>
    )}

    {notes && (
      <div className='mb-3'>
        <h3 className='mb-2 border-b border-gray-200/40 pb-1 text-lg font-semibold text-gray-900 dark:border-gray-700/40 dark:text-white'>
          Explanation
        </h3>
        <MarkdownContent content={notes} variant='notes' />
      </div>
    )}
  </>
);

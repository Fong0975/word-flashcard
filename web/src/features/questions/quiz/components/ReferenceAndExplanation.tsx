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
        <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
          Reference
        </h3>
        <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            {reference}
          </p>
        </div>
      </div>
    )}

    {notes && (
      <div className='mb-3'>
        <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
          Explanation
        </h3>
        <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
          <MarkdownContent content={notes} variant='boxed-gray' />
        </div>
      </div>
    )}
  </>
);

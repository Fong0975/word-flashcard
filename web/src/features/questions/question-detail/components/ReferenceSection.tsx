import React from 'react';

import { ReferenceSectionProps } from '../types/question-detail';

export const ReferenceSection: React.FC<ReferenceSectionProps> = ({
  reference,
}) => {
  if (!reference) {
    return null;
  }

  return (
    <div>
      <h2 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
        Reference
      </h2>
      <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
        <p className='text-sm text-gray-700 dark:text-gray-300'>{reference}</p>
      </div>
    </div>
  );
};

import React from 'react';

import { OptionItemProps } from '../types/question-detail';

export const OptionItem: React.FC<OptionItemProps> = ({ option }) => {
  return (
    <div className='flex items-start space-x-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700'>
      <span className='inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
        {option.key}
      </span>
      <span className='flex-1 leading-relaxed text-gray-700 dark:text-gray-300'>
        {option.value}
      </span>
    </div>
  );
};

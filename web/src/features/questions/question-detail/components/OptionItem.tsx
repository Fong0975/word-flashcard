import React from 'react';

import { OptionItemProps } from '../types/question-detail';

export const OptionItem: React.FC<OptionItemProps> = ({ option }) => {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium text-sm flex-shrink-0">
        {option.key}
      </span>
      <span className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
        {option.value}
      </span>
    </div>
  );
};
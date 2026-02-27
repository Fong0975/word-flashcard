import React from 'react';

import { WordFooterProps } from '../types/word-detail';

export const WordFooter: React.FC<WordFooterProps> = ({ word }) => {
  return (
    <div className='border-t border-gray-200 pt-4 dark:border-gray-700'>
      <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
        <span>Word ID: {word.id}</span>
        <span>{word.definitions?.length || 0} definition(s)</span>
      </div>
    </div>
  );
};

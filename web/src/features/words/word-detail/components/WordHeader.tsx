import React from 'react';

import { WordHeaderProps } from '../types/word-detail';

import { FamiliarityBar } from './FamiliarityBar';
import { WordActions } from './WordActions';

export const WordHeader: React.FC<WordHeaderProps> = ({
  word,
  onEdit,
  onDelete,
}) => {
  return (
    <div className='mb-6 border-b border-gray-200 pb-2 dark:border-gray-700'>
      <div className='mb-4 text-center'>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-white'>
          {word.word}
        </h1>
      </div>

      <FamiliarityBar familiarity={word.familiarity} />

      <WordActions word={word} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

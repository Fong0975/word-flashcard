import React from 'react';

interface PartOfSpeechTagsProps {
  partOfSpeech: string;
}

export const PartOfSpeechTags: React.FC<PartOfSpeechTagsProps> = ({
  partOfSpeech,
}) => {
  if (!partOfSpeech) {
    return null;
  }

  return (
    <div className='flex items-center space-x-2'>
      {partOfSpeech
        .split(',')
        .filter(pos => pos.trim())
        .map((pos, index) => (
          <span
            key={index}
            className='inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          >
            {pos.trim()}
          </span>
        ))}
    </div>
  );
};

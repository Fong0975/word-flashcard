import React from 'react';

interface PartOfSpeechTagsProps {
  partOfSpeech: string;
}

export const PartOfSpeechTags: React.FC<PartOfSpeechTagsProps> = ({ partOfSpeech }) => {
  if (!partOfSpeech) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {partOfSpeech
        .split(',')
        .filter(pos => pos.trim())
        .map((pos, index) => (
          <span
            key={index}
            className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
          >
            {pos.trim()}
          </span>
        ))
      }
    </div>
  );
};
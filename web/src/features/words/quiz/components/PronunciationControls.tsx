import React from 'react';

import { PronunciationButton } from '../../../../components/ui/PronunciationButton';
import { speakText } from '../../../shared/speech';

interface PronunciationControlsProps {
  word: string;
  pronunciationUrls: { uk?: string | null; us?: string | null };
  hasUkUrl: boolean;
  hasUsUrl: boolean;
  className?: string;
}

export const PronunciationControls: React.FC<PronunciationControlsProps> = ({
  word,
  pronunciationUrls,
  hasUkUrl,
  hasUsUrl,
  className = 'flex items-center justify-center space-x-4',
}) => (
  <div className={className}>
    {hasUkUrl ? (
      <PronunciationButton
        audioUrl={pronunciationUrls.uk!}
        accent='uk'
        size='md'
      />
    ) : (
      <button
        onClick={() => speakText(word, 'en-GB')}
        title='British pronunciation'
        className='inline-flex items-center space-x-1 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:active:bg-blue-900/70'
      >
        <span className='text-xs' role='img' aria-label='UK accent'>
          🇬🇧
        </span>
        <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M8 5v14l11-7z' />
        </svg>
        <span>UK</span>
      </button>
    )}
    {hasUsUrl ? (
      <PronunciationButton
        audioUrl={pronunciationUrls.us!}
        accent='us'
        size='md'
      />
    ) : (
      <button
        onClick={() => speakText(word, 'en-US')}
        title='American pronunciation'
        className='inline-flex items-center space-x-1 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:active:bg-blue-900/70'
      >
        <span className='text-xs' role='img' aria-label='US accent'>
          🇺🇸
        </span>
        <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M8 5v14l11-7z' />
        </svg>
        <span>US</span>
      </button>
    )}
  </div>
);

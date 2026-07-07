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
        className='inline-flex items-center space-x-1 rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100 active:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 dark:active:bg-amber-900/60'
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
        className='inline-flex items-center space-x-1 rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100 active:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 dark:active:bg-amber-900/60'
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

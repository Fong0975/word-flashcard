import React from 'react';

import { PronunciationButton } from '../../../../components/ui/PronunciationButton';
import {
  extractPronunciationUrls,
  isValidAudioUrl,
} from '../../../shared/phonetics';
import { speakText } from '../../../shared/speech';
import { PronunciationGroupProps } from '../types/word-detail';

const ACCENT_CONFIG = {
  uk: {
    flag: '🇬🇧',
    label: 'UK',
    title: 'British pronunciation',
    locale: 'en-GB' as const,
  },
  us: {
    flag: '🇺🇸',
    label: 'US',
    title: 'American pronunciation',
    locale: 'en-US' as const,
  },
};

interface SpeechButtonProps {
  accent: 'uk' | 'us';
  wordText: string;
}

const SpeechButton: React.FC<SpeechButtonProps> = ({ accent, wordText }) => {
  const { flag, label, title, locale } = ACCENT_CONFIG[accent];
  return (
    <button
      onClick={() => speakText(wordText, locale)}
      title={title}
      className='inline-flex items-center space-x-1 rounded-md border border-dashed border-amber-400 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100 active:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 dark:active:bg-amber-900/60'
    >
      <span className='text-xs' role='img' aria-label={`${label} accent`}>
        {flag}
      </span>
      <span>
        <svg className='h-3 w-3' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M8 5v14l11-7z' />
        </svg>
      </span>
      <span>{label}</span>
    </button>
  );
};

export const PronunciationGroup: React.FC<PronunciationGroupProps> = ({
  phonetics,
  speechFallback,
}) => {
  const pronunciationUrls = extractPronunciationUrls(phonetics);
  const hasUkUrl =
    !!pronunciationUrls.uk && isValidAudioUrl(pronunciationUrls.uk);
  const hasUsUrl =
    !!pronunciationUrls.us && isValidAudioUrl(pronunciationUrls.us);

  const showUkSpeech = !hasUkUrl && !!speechFallback?.uk;
  const showUsSpeech = !hasUsUrl && !!speechFallback?.us;

  if (!hasUkUrl && !hasUsUrl && !showUkSpeech && !showUsSpeech) {
    return null;
  }

  return (
    <div className='flex items-center space-x-2'>
      {hasUkUrl ? (
        <PronunciationButton
          audioUrl={pronunciationUrls.uk!}
          accent='uk'
          size='sm'
        />
      ) : showUkSpeech ? (
        <SpeechButton accent='uk' wordText={speechFallback!.wordText} />
      ) : null}
      {hasUsUrl ? (
        <PronunciationButton
          audioUrl={pronunciationUrls.us!}
          accent='us'
          size='sm'
        />
      ) : showUsSpeech ? (
        <SpeechButton accent='us' wordText={speechFallback!.wordText} />
      ) : null}
    </div>
  );
};

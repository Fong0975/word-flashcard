import React, { useId, useMemo } from 'react';

import { SpeechLocale } from '../../features/shared/speech';
import { useSilentModeHint } from '../../hooks/useSilentModeHint';
import { useSpeech } from '../../hooks/useSpeech';
import { isAppleMobileDevice } from '../../utils/platform';

interface SpeechPronunciationButtonProps {
  text: string;
  accent: 'uk' | 'us';
  size?: 'sm' | 'md';
}

const ACCENT_CONFIG: Record<
  'uk' | 'us',
  { label: string; flag: string; title: string; locale: SpeechLocale }
> = {
  uk: {
    label: 'UK',
    flag: '🇬🇧',
    title: 'British pronunciation',
    locale: 'en-GB',
  },
  us: {
    label: 'US',
    flag: '🇺🇸',
    title: 'American pronunciation',
    locale: 'en-US',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
};

const ICON_SIZE_CLASSES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
};

const SILENT_MODE_HINT =
  "No sound? Check that your device's silent mode is turned off.";

/**
 * Pronunciation button backed by the browser's speech synthesis. Browser
 * speech cannot be paused, so while speaking the button shows a pulsing
 * speaker icon and a highlighted style instead of a pause control. On Apple
 * mobile devices a tooltip reminds users that silent mode mutes speech.
 */
export const SpeechPronunciationButton: React.FC<
  SpeechPronunciationButtonProps
> = ({ text, accent, size = 'sm' }) => {
  const { isSpeaking, speak } = useSpeech();
  const isApple = useMemo(() => isAppleMobileDevice(), []);
  const {
    isVisible: isHintVisible,
    handlers: { onFocus, onBlur, onClick: onHintClick },
  } = useSilentModeHint(isApple);
  const hintId = useId();
  const { label, flag, title, locale } = ACCENT_CONFIG[accent];
  const iconSize = ICON_SIZE_CLASSES[size];

  return (
    <span className='relative inline-flex'>
      <button
        onClick={() => {
          onHintClick();
          speak(text, locale);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        title={title}
        aria-busy={isSpeaking}
        aria-describedby={isHintVisible ? hintId : undefined}
        className={`inline-flex items-center space-x-1 rounded-md font-medium transition-colors duration-200 ${SIZE_CLASSES[size]} ${
          isSpeaking
            ? 'bg-blue-200 text-blue-900 ring-1 ring-blue-400 dark:bg-blue-800/60 dark:text-blue-100 dark:ring-blue-500'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:active:bg-blue-900/70'
        }`}
      >
        <span className='text-xs' role='img' aria-label={`${label} accent`}>
          {flag}
        </span>
        <span className='flex items-center'>
          {isSpeaking ? (
            <svg
              data-testid='speech-playing-icon'
              className={`animate-pulse ${iconSize}`}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
              />
            </svg>
          ) : (
            <svg className={iconSize} fill='currentColor' viewBox='0 0 24 24'>
              <path d='M8 5v14l11-7z' />
            </svg>
          )}
        </span>
        <span>{isSpeaking ? `${label}…` : label}</span>
      </button>
      {isHintVisible && (
        <span
          id={hintId}
          role='tooltip'
          className='pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max max-w-56 -translate-x-1/2 whitespace-normal rounded-md bg-gray-800 px-2 py-1 text-center text-xs font-normal text-white shadow-lg dark:bg-gray-100 dark:text-gray-900'
        >
          {SILENT_MODE_HINT}
        </span>
      )}
    </span>
  );
};

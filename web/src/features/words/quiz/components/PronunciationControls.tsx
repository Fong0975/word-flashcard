import React from 'react';

import { PronunciationButton } from '../../../../components/ui/PronunciationButton';
import { SpeechPronunciationButton } from '../../../../components/ui/SpeechPronunciationButton';

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
      <SpeechPronunciationButton text={word} accent='uk' size='md' />
    )}
    {hasUsUrl ? (
      <PronunciationButton
        audioUrl={pronunciationUrls.us!}
        accent='us'
        size='md'
      />
    ) : (
      <SpeechPronunciationButton text={word} accent='us' size='md' />
    )}
  </div>
);

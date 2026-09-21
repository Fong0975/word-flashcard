import React from 'react';

import { PronunciationButton } from '../../../../components/ui/PronunciationButton';
import { SilentModeHint } from '../../../../components/ui/SilentModeHint';
import { SpeechPronunciationButton } from '../../../../components/ui/SpeechPronunciationButton';
import {
  extractPronunciationUrls,
  isValidAudioUrl,
} from '../../../shared/phonetics';
import { PronunciationGroupProps } from '../types/word-detail';

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
    <div className='flex flex-col items-center'>
      <div className='flex items-center space-x-2'>
        {hasUkUrl ? (
          <PronunciationButton
            audioUrl={pronunciationUrls.uk!}
            accent='uk'
            size='sm'
          />
        ) : showUkSpeech ? (
          <SpeechPronunciationButton
            accent='uk'
            text={speechFallback!.wordText}
          />
        ) : null}
        {hasUsUrl ? (
          <PronunciationButton
            audioUrl={pronunciationUrls.us!}
            accent='us'
            size='sm'
          />
        ) : showUsSpeech ? (
          <SpeechPronunciationButton
            accent='us'
            text={speechFallback!.wordText}
          />
        ) : null}
      </div>
      {(showUkSpeech || showUsSpeech) && <SilentModeHint />}
    </div>
  );
};

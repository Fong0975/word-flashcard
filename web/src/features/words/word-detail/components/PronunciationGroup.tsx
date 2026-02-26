import React from 'react';

import { PronunciationButton } from '../../../../components/ui/PronunciationButton';
import { extractPronunciationUrls, isValidAudioUrl } from '../../../shared/phonetics';
import { PronunciationGroupProps } from '../types/word-detail';

export const PronunciationGroup: React.FC<PronunciationGroupProps> = ({ phonetics }) => {
  const pronunciationUrls = extractPronunciationUrls(phonetics);

  if (!pronunciationUrls.uk && !pronunciationUrls.us) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {pronunciationUrls.uk && isValidAudioUrl(pronunciationUrls.uk) && (
        <PronunciationButton
          audioUrl={pronunciationUrls.uk}
          accent="uk"
          size="sm"
        />
      )}
      {pronunciationUrls.us && isValidAudioUrl(pronunciationUrls.us) && (
        <PronunciationButton
          audioUrl={pronunciationUrls.us}
          accent="us"
          size="sm"
        />
      )}
    </div>
  );
};
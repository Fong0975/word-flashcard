import { useCallback, useRef, useState } from 'react';

import { SpeechLocale, speakText } from '../features/shared/speech';

export interface UseSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, locale: SpeechLocale) => boolean;
}

/**
 * Wraps `speakText` and tracks whether this hook's own utterance is currently
 * being spoken. Events from superseded utterances (e.g. cancelled by a newer
 * `speak` call) are ignored so they cannot clear the state of the new one.
 */
export const useSpeech = (): UseSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const latestRequestRef = useRef(0);

  const speak = useCallback((text: string, locale: SpeechLocale) => {
    const requestId = ++latestRequestRef.current;
    const started = Boolean(
      speakText(text, locale, () => {
        if (latestRequestRef.current === requestId) {
          setIsSpeaking(false);
        }
      }),
    );
    setIsSpeaking(started);
    return started;
  }, []);

  return { isSpeaking, speak };
};

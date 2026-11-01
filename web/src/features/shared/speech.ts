import { isAppleMobileDevice } from '../../utils/platform';

export type SpeechLocale = 'en-US' | 'en-GB';

const WARM_UP_INTERVAL_MS = 5000;

let lastSpeechActivityAt = -Infinity;

/**
 * Wakes the iOS speech engine with an inaudible utterance so the first real
 * utterance after an idle period does not lose its opening fraction of a
 * second. Skipped on other platforms and while the engine is already warm
 * (recently used or currently speaking). Call it from a user gesture.
 */
export const warmUpSpeech = (): void => {
  if (!window.speechSynthesis || !isAppleMobileDevice()) {
    return;
  }

  const now = Date.now();
  if (
    window.speechSynthesis.speaking ||
    now - lastSpeechActivityAt < WARM_UP_INTERVAL_MS
  ) {
    return;
  }
  lastSpeechActivityAt = now;

  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
};

/**
 * Speaks the given text using the Web Speech API.
 * @param text - The word or phrase to speak.
 * @param locale - The language/accent to use ('en-US' or 'en-GB').
 * @param onEnd - Optional callback invoked when the utterance finishes, fails, or is cancelled.
 * @returns true if speech was initiated, false if the API is unavailable.
 */
export const speakText = (
  text: string,
  locale: SpeechLocale = 'en-US',
  onEnd?: () => void,
): boolean => {
  if (!window.speechSynthesis) {
    return false;
  }

  window.speechSynthesis.cancel();
  lastSpeechActivityAt = Date.now();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);

  return true;
};

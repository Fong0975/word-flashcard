export type SpeechLocale = 'en-US' | 'en-GB';

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

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);

  return true;
};

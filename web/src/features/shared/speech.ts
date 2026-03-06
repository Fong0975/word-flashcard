export type SpeechLocale = 'en-US' | 'en-GB';

/**
 * Speaks the given text using the Web Speech API.
 * @param text - The word or phrase to speak.
 * @param locale - The language/accent to use ('en-US' or 'en-GB').
 * @returns true if speech was initiated, false if the API is unavailable.
 */
export const speakText = (
  text: string,
  locale: SpeechLocale = 'en-US',
): boolean => {
  if (!window.speechSynthesis) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  window.speechSynthesis.speak(utterance);

  return true;
};

/**
 * Checks whether the Web Speech API is supported in the current browser.
 */
export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

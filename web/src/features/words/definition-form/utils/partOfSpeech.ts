/** Part of speech values the definition API accepts, in UI display order. */
export const PART_OF_SPEECH_OPTIONS = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'phrase',
  'other',
];

const PHRASE_PATTERN = /phras|idiom/;

/**
 * Maps any part-of-speech label (e.g. one returned by the dictionary lookup or
 * stored before the allowed values were enforced) to one of
 * PART_OF_SPEECH_OPTIONS.
 *
 * Multi-word expressions ("prepositional phrase", "phrasal verb", "idiom")
 * become "phrase". Other labels that contain an allowed value as a whole word
 * ("proper noun", "modal verb") take that value. Anything else
 * ("pronoun", "determiner", ...) becomes "other".
 *
 * @param pos - Raw part-of-speech label.
 * @returns A value from PART_OF_SPEECH_OPTIONS.
 */
export const normalizePartOfSpeech = (pos: string): string => {
  const label = pos.trim().toLowerCase();
  if (PART_OF_SPEECH_OPTIONS.includes(label)) {
    return label;
  }
  if (PHRASE_PATTERN.test(label)) {
    return 'phrase';
  }

  const matched = label
    .split(/[^a-z]+/)
    .find(token => PART_OF_SPEECH_OPTIONS.includes(token));
  return matched ?? 'other';
};

/**
 * Normalizes each label and removes duplicates, keeping first-seen order.
 *
 * @param labels - Raw part-of-speech labels.
 * @returns Distinct values from PART_OF_SPEECH_OPTIONS.
 */
export const normalizePartsOfSpeech = (labels: string[]): string[] =>
  Array.from(new Set(labels.map(normalizePartOfSpeech)));

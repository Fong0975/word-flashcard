/**
 * Quiz-related constants and configurations
 * Used across different quiz implementations (Words, Questions)
 */

export const DEFAULT_QUIZ_CONFIG = {
  QUESTION_COUNT: 15,
  QUESTION_COUNT_OPTIONS: [5, 10, 15, 20, 25, 30],
} as const;

/**
 * Accuracy rate color thresholds and classes
 */
export const ACCURACY_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
} as const;

/** Highest word quiz improvement percentage still shown as `yellow`. */
const IMPROVEMENT_YELLOW_MAX = 20;

export type AccuracyTone = 'green' | 'yellow' | 'red';

/**
 * Map an accuracy percentage to its status tone.
 *
 * @param rate - Accuracy percentage (0-100)
 * @returns `green` at or above the high threshold, `yellow` at or above the
 *   medium threshold, otherwise `red`
 */
export const getAccuracyTone = (rate: number): AccuracyTone => {
  if (rate >= ACCURACY_THRESHOLDS.HIGH) {
    return 'green';
  }
  if (rate >= ACCURACY_THRESHOLDS.MEDIUM) {
    return 'yellow';
  }
  return 'red';
};

const ACCURACY_RATE_COLORS: Record<AccuracyTone, string> = {
  green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  yellow:
    'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
};

const SCORE_COLORS: Record<AccuracyTone, string> = {
  green: 'text-green-600 dark:text-green-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  red: 'text-red-600 dark:text-red-400',
};

const SCORE_BADGE_COLORS: Record<AccuracyTone, string> = {
  green:
    'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
  yellow:
    'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
  red: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
};

/**
 * `-700` in light keeps small text at WCAG AA on translucent glass, where the
 * `-600` shades of `SCORE_COLORS` (sized for large numerals) fall short.
 */
const ACCURACY_TEXT_COLORS: Record<AccuracyTone, string> = {
  green: 'text-green-700 dark:text-green-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  red: 'text-red-700 dark:text-red-400',
};

const ACCURACY_TONE_CLASSES: Record<AccuracyTone, string> = {
  green: 'glass-glow-green',
  yellow: 'glass-glow-yellow',
  red: 'glass-glow-red',
};

/**
 * Get accuracy rate color based on percentage
 */
export const getAccuracyRateColor = (rate: number): string =>
  ACCURACY_RATE_COLORS[getAccuracyTone(rate)];

/**
 * Map a word quiz improvement percentage to its status tone. It has its own
 * scale because words already at the top familiarity cannot improve, so the
 * accuracy thresholds would be too strict.
 *
 * @param rate - Improvement percentage (0-100)
 * @returns `red` when nothing improved, `yellow` up to and including the yellow
 *   limit, otherwise `green`
 */
export const getImprovementTone = (rate: number): AccuracyTone => {
  if (rate <= 0) {
    return 'red';
  }
  if (rate <= IMPROVEMENT_YELLOW_MAX) {
    return 'yellow';
  }
  return 'green';
};

/**
 * Get the text color of a quiz result's headline score.
 *
 * @param tone - Status tone of the score
 * @returns Tailwind text color classes for both themes
 */
export const getScoreColor = (tone: AccuracyTone): string => SCORE_COLORS[tone];

/**
 * Get the surface, text and border classes of the capsule shown under a quiz
 * score.
 *
 * @param tone - Status tone of the score
 * @returns Tailwind color classes for both themes
 */
export const getScoreBadgeColor = (tone: AccuracyTone): string =>
  SCORE_BADGE_COLORS[tone];

/**
 * Get the text color for body-sized accuracy statistics on a glass surface.
 *
 * @param rate - Accuracy percentage (0-100)
 * @returns Tailwind text color classes for both themes
 */
export const getAccuracyTextColor = (rate: number): string =>
  ACCURACY_TEXT_COLORS[getAccuracyTone(rate)];

/**
 * Get the tone class that sets the glow hue (`--glass-glow`) for an accuracy
 * percentage. Pair it with `.glass-glow` or `.glass-glow-bar`.
 *
 * @param rate - Accuracy percentage (0-100)
 * @returns The `.glass-glow-*` tone class
 */
export const getAccuracyToneClass = (rate: number): string =>
  ACCURACY_TONE_CLASSES[getAccuracyTone(rate)];

/**
 * Get the glass rim-light classes that tint a `.glass-panel` edge with the
 * outcome of a submitted answer.
 *
 * @param isCorrect - Whether the submitted answer was correct
 * @returns The `.glass-glow` class pair: green when correct, red otherwise
 */
export const getAnswerGlowClass = (isCorrect: boolean): string =>
  `glass-glow ${ACCURACY_TONE_CLASSES[isCorrect ? 'green' : 'red']}`;

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

/**
 * Get accuracy rate color based on percentage
 */
export const getAccuracyRateColor = (rate: number): string => {
  if (rate >= ACCURACY_THRESHOLDS.HIGH) {
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  }
  if (rate >= ACCURACY_THRESHOLDS.MEDIUM) {
    return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
  }
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
};

/**
 * Get score color for quiz results
 */
export const getScoreColor = (percentage: number): string => {
  if (percentage >= ACCURACY_THRESHOLDS.HIGH) {
    return 'text-green-600 dark:text-green-400';
  }
  if (percentage >= ACCURACY_THRESHOLDS.MEDIUM) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  return 'text-red-600 dark:text-red-400';
};

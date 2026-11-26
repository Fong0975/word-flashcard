import { calculateAccuracyRate } from '../../question-detail/utils/accuracyCalculation';

/**
 * Formats a question's accuracy with the underlying tally, e.g. "75% (3/4)".
 *
 * @param countPractise - How many times the question has been answered
 * @param countFailurePractise - How many of those answers were wrong
 * @returns The formatted accuracy, or "N/A" when never answered
 */
export const formatAccuracyWithCount = (
  countPractise: number,
  countFailurePractise: number,
): string => {
  if (countPractise === 0) {
    return 'N/A';
  }
  const rate = calculateAccuracyRate(countPractise, countFailurePractise);
  return `${rate}% (${countPractise - countFailurePractise}/${countPractise})`;
};

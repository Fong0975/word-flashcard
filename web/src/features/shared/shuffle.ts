/**
 * Returns a new array with the same elements in random order
 * (Fisher-Yates shuffle).
 */
export const shuffleArray = <T>(array: readonly T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

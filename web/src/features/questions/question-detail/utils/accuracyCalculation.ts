export const calculateAccuracyRate = (
  practiceCount: number,
  failureCount: number,
): number => {
  if (practiceCount === 0) {
    return 0;
  }
  const successCount = practiceCount - failureCount;
  return Math.round((successCount / practiceCount) * 100);
};

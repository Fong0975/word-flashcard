export const calculateAccuracyRate = (practiceCount: number, failureCount: number): number => {
  if (practiceCount === 0) {return 0;}
  const successCount = practiceCount - failureCount;
  return Math.round((successCount / practiceCount) * 100);
};

export const getAccuracyRateColor = (rate: number): string => {
  if (rate >= 80) {return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';}
  if (rate >= 60) {return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';}
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
};
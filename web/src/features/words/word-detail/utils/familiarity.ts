export const getFamiliarityBarColor = (familiarity: string): string => {
  switch (familiarity.toLowerCase()) {
    case 'green':
      return 'bg-green-500 dark:bg-green-400';
    case 'yellow':
      return 'bg-yellow-500 dark:bg-yellow-400';
    case 'red':
      return 'bg-red-500 dark:bg-red-400';
    default:
      return 'bg-gray-400 dark:bg-gray-500';
  }
};
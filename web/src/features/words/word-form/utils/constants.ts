import { FamiliarityLevel } from '../../../../types/base';
import { FamiliarityOption } from '../types';

export const FAMILIARITY_OPTIONS: FamiliarityOption[] = [
  {
    value: FamiliarityLevel.GREEN,
    label: 'Green',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: FamiliarityLevel.YELLOW,
    label: 'Yellow',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    value: FamiliarityLevel.RED,
    label: 'Red',
    color: 'text-red-600 dark:text-red-400',
  },
];

export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_SUGGESTIONS = 5;

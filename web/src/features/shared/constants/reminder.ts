import { SearchCondition, SearchOperation } from '../../../types/base';

/** The quick filter that narrows a review list to entries with a reminder. */
export const WITH_REMINDER_FILTER = {
  key: 'withReminder',
  label: 'With Reminder',
  dotClassName: 'bg-gray-500',
} as const;

/**
 * Matches entries holding a reminder. Both checks are needed because a note
 * that was never set is NULL, while a cleared one is an empty string.
 */
export const WITH_REMINDER_CONDITIONS: readonly SearchCondition[] = [
  { key: 'reminder', operator: SearchOperation.IS_NOT_NULL },
  { key: 'reminder', operator: SearchOperation.IS_NOT_EMPTY },
];

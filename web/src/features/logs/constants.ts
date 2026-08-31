/**
 * Log level presentation constants
 *
 * Colours follow the same severity intuition as the familiarity dots:
 * neutral for noise, blue for normal, amber for warnings, red for errors.
 */

import { LogLevel } from '../../types/logs';

/** Dot colour for each level's quick-filter pill. */
export const LOG_LEVEL_DOT_CLASSES: Readonly<Record<LogLevel, string>> = {
  DEBUG: 'bg-gray-400',
  INFO: 'bg-blue-500',
  WARN: 'bg-yellow-500',
  ERROR: 'bg-red-500',
};

/** Badge colour for the level shown beside each entry. */
export const LOG_LEVEL_BADGE_CLASSES: Readonly<Record<LogLevel, string>> = {
  DEBUG: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  WARN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

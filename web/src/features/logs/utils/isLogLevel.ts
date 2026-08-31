import { LOG_LEVELS, LogLevel } from '../../../types/logs';

/**
 * Narrows an arbitrary quick-filter key to a known log level.
 *
 * Quick-filter selections are restored from sessionStorage, so a stale or
 * hand-edited value could otherwise reach the API as a bogus level.
 */
export const isLogLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

/**
 * Formats a log entry timestamp for display.
 *
 * Uses a fixed `YYYY-MM-DD HH:mm:ss` layout rather than `toLocaleString` so
 * the rendering matches the log file's own format and does not shift with the
 * viewer's locale. An unparsable value is returned unchanged rather than
 * rendered as "Invalid Date".
 */
export const formatLogTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const pad = (value: number): string => String(value).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
};

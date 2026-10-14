const TAIPEI_TIME_ZONE = 'Asia/Taipei';

/**
 * Formats an ISO timestamp as a short date, always rendered in the
 * Asia/Taipei timezone regardless of the viewer's local timezone.
 */
export const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { timeZone: TAIPEI_TIME_ZONE });

/**
 * Formats an ISO timestamp as separate date and time strings, with the
 * time rendered in 24-hour format (no AM/PM), always in the Asia/Taipei
 * timezone. Intended for compact table columns that stack date and time
 * on separate lines instead of one long combined string.
 */
export const formatDateTimeParts = (
  iso: string,
): { date: string; time: string } => {
  const value = new Date(iso);
  return {
    date: value.toLocaleDateString(undefined, { timeZone: TAIPEI_TIME_ZONE }),
    time: value.toLocaleTimeString(undefined, {
      timeZone: TAIPEI_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      // `hourCycle` instead of `hour12: false`, which some engines render
      // as "24:30" for half past midnight.
      hourCycle: 'h23',
    }),
  };
};

/**
 * Formats an ISO timestamp as a single-line date and 24-hour time (no
 * seconds, no AM/PM), always rendered in the Asia/Taipei timezone
 * regardless of the viewer's local timezone.
 */
export const formatDateTime = (iso: string): string => {
  const { date, time } = formatDateTimeParts(iso);
  return `${date} ${time}`;
};

/**
 * Formats a nullable ISO timestamp as a short date (e.g. "Jul 20, 2026"),
 * always rendered in the Asia/Taipei timezone. Returns '-' when `dateStr`
 * is null.
 */
export const formatNoteDate = (dateStr: string | null): string => {
  if (!dateStr) {
    return '-';
  }
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TAIPEI_TIME_ZONE,
  });
};

/**
 * Formats a nullable ISO timestamp as a short date and time
 * (e.g. "Jul 20, 2026, 06:00 PM"), always rendered in the Asia/Taipei
 * timezone. Returns '-' when `dateStr` is null.
 */
export const formatNoteDateTime = (dateStr: string | null): string => {
  if (!dateStr) {
    return '-';
  }
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TAIPEI_TIME_ZONE,
  });
};

const TAIPEI_TIME_ZONE = 'Asia/Taipei';

/**
 * Formats an ISO timestamp as a short date, always rendered in the
 * Asia/Taipei timezone regardless of the viewer's local timezone.
 */
export const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { timeZone: TAIPEI_TIME_ZONE });

/**
 * Formats an ISO timestamp as a date and time, always rendered in the
 * Asia/Taipei timezone regardless of the viewer's local timezone.
 */
export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { timeZone: TAIPEI_TIME_ZONE });

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

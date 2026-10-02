/**
 * Slow request notice hook
 *
 * Fires a callback once when a request has been loading for longer than a
 * threshold, so the UI can reassure the user that work is still in progress.
 */

import { useEffect, useRef } from 'react';

/** Default delay before a loading request is considered slow. */
export const SLOW_REQUEST_THRESHOLD_MS = 5000;

/**
 * Calls `onSlow` once if `isLoading` stays true for `thresholdMs`.
 *
 * The timer starts when `isLoading` becomes true and is cleared when it turns
 * false or the component unmounts. A new loading cycle starts a fresh timer.
 *
 * @param isLoading - Whether the request is currently in flight.
 * @param onSlow - Invoked once per loading cycle after the threshold elapses.
 *   The latest callback is always used, so it need not be memoized.
 * @param thresholdMs - Delay in milliseconds before `onSlow` fires.
 */
export const useSlowRequestNotice = (
  isLoading: boolean,
  onSlow: () => void,
  thresholdMs: number = SLOW_REQUEST_THRESHOLD_MS,
): void => {
  const onSlowRef = useRef(onSlow);
  onSlowRef.current = onSlow;

  useEffect(() => {
    if (!isLoading) {
      return undefined;
    }

    const timer = setTimeout(() => onSlowRef.current(), thresholdMs);
    return () => clearTimeout(timer);
  }, [isLoading, thresholdMs]);
};

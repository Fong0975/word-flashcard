import { useCallback, useEffect, useRef } from 'react';

import { useSlowRequestNotice } from '../../../../hooks/ui/useSlowRequestNotice';

export const SLOW_LOOKUP_MESSAGE =
  "Taking longer than expected. We're still fetching the definition…";

// Matches the backend's retry deadline so the toast outlives the lookup it
// describes; it is dismissed explicitly as soon as the lookup settles.
export const SLOW_LOOKUP_TOAST_DURATION_MS = 25000;

/** Toast controls needed to show and dismiss the slow-lookup warning. */
export interface SlowLookupToast {
  show: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

/**
 * Shows a warning toast when a dictionary lookup stays in flight past the slow
 * request threshold, and removes it once the lookup settles.
 *
 * @param isFetching - Whether this hook's owner has a lookup in flight.
 * @param toast - Toast controls; when omitted the hook does nothing.
 */
export const useSlowLookupToast = (
  isFetching: boolean,
  toast?: SlowLookupToast,
): void => {
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const toastIdRef = useRef<string | null>(null);

  const handleSlow = useCallback(() => {
    toastIdRef.current =
      toastRef.current?.show(
        SLOW_LOOKUP_MESSAGE,
        SLOW_LOOKUP_TOAST_DURATION_MS,
      ) ?? null;
  }, []);

  useSlowRequestNotice(isFetching, handleSlow);

  useEffect(() => {
    if (!isFetching && toastIdRef.current !== null) {
      toastRef.current?.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, [isFetching]);
};

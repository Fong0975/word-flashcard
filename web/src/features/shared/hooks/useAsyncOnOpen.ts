import { useState, useEffect, useCallback } from 'react';

import { getApiErrorMessage } from '../../../lib/apiErrorMessage';

interface UseAsyncOnOpenOptions<T> {
  isOpen: boolean;
  fetcher: () => Promise<T>;
  errorMessage: string;
}

interface UseAsyncOnOpenReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs fetcher on demand, e.g. from a manual refresh button. */
  refetch: () => void;
}

/**
 * Fetches data whenever `isOpen` becomes true (e.g. a modal opening),
 * tracking loading/error state around the request. Also exposes `refetch`
 * for re-running the same fetch on demand without waiting for `isOpen` to
 * transition again.
 */
export const useAsyncOnOpen = <T>({
  isOpen,
  fetcher,
  errorMessage,
}: UseAsyncOnOpenOptions<T>): UseAsyncOnOpenReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(result => setData(result))
      .catch(err => setError(getApiErrorMessage(err, errorMessage)))
      .finally(() => setLoading(false));
  }, [fetcher, errorMessage]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return { data, loading, error, refetch: runFetch };
};

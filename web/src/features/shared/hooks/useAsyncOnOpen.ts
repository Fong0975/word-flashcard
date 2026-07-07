import { useState, useEffect } from 'react';

interface UseAsyncOnOpenOptions<T> {
  isOpen: boolean;
  fetcher: () => Promise<T>;
  errorMessage: string;
}

interface UseAsyncOnOpenReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches data whenever `isOpen` becomes true (e.g. a modal opening),
 * tracking loading/error state around the request.
 */
export const useAsyncOnOpen = <T>({
  isOpen,
  fetcher,
  errorMessage,
}: UseAsyncOnOpenOptions<T>): UseAsyncOnOpenReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLoading(true);
    setError(null);
    fetcher()
      .then(result => setData(result))
      .catch(() => setError(errorMessage))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return { data, loading, error };
};

import { useState, useEffect, useRef } from 'react';

/**
 * Reports whether a list has finished loading at least once.
 *
 * List screens swap their whole tree for a bare spinner while the very first
 * load is in flight. Later refetches can look identical to that first load
 * (loading, empty list, empty search term — e.g. clearing a search that had
 * no results), and swapping the tree then would unmount the search input and
 * drop its focus. This flag lets callers tell the two apart.
 *
 * @param loading - Whether the list is currently being fetched.
 * @returns `true` once `loading` has gone from `true` back to `false`, and
 * for the rest of the component's lifetime.
 */
export const useHasLoadedOnce = (loading: boolean): boolean => {
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const hasStartedLoadingRef = useRef(false);

  useEffect(() => {
    if (loading) {
      hasStartedLoadingRef.current = true;
    } else if (hasStartedLoadingRef.current) {
      setHasLoadedOnce(true);
    }
  }, [loading]);

  return hasLoadedOnce;
};

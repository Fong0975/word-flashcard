import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EntityListHook, BaseEntity } from '../../../types';

interface UseUrlSyncedEntityListOptions<T extends BaseEntity> {
  entityListHook: EntityListHook<T>;
  /** sessionStorage key used to persist the search term across navigation. */
  sessionSearchKey: string;
  /** Stable string representation of any extra filters (e.g. from useQuickFilters) that should reset to page 1 when changed. */
  filtersKey: string;
}

interface UseUrlSyncedEntityListReturn<T extends BaseEntity> {
  /** entityListHook with pagination/search methods patched to go through the URL. */
  patchedHook: EntityListHook<T>;
  urlSort: string;
  handleSortChange: (value: string) => void;
}

/**
 * Makes the URL the source of truth for an entity list's page and sort,
 * and resets to page 1 whenever `filtersKey` changes. Pagination/search
 * actions on the returned `patchedHook` only update the URL; the actual
 * refetch is driven by effects here reacting to URL/filter changes.
 */
export const useUrlSyncedEntityList = <T extends BaseEntity>({
  entityListHook,
  sessionSearchKey,
  filtersKey,
}: UseUrlSyncedEntityListOptions<T>): UseUrlSyncedEntityListReturn<T> => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const urlSort = useMemo(() => searchParams.get('sort') || '', [searchParams]);

  const setUrlPage = useCallback(
    (page: number) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (page <= 1) {
            next.delete('page');
          } else {
            next.set('page', page.toString());
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.delete('page');
          if (value) {
            next.set('sort', value);
          } else {
            next.delete('sort');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Keep a stable ref to fetchEntities to avoid stale closures in the effect below
  const fetchEntitiesRef = useRef(entityListHook.fetchEntities);
  fetchEntitiesRef.current = entityListHook.fetchEntities;

  // Keep a ref to current page to check inside the effect without adding it as a dep
  const currentPageRef = useRef(entityListHook.currentPage);
  currentPageRef.current = entityListHook.currentPage;

  // Sync URL → hook: when the URL page param changes externally (address bar, browser history),
  // fetch the corresponding page in the hook.
  useEffect(() => {
    if (urlPage !== currentPageRef.current) {
      fetchEntitiesRef.current(urlPage);
    }
  }, [urlPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL → hook: when the sort param changes, reset to page 1 and refetch.
  const prevSortRef = useRef(urlSort);
  useEffect(() => {
    if (urlSort !== prevSortRef.current) {
      prevSortRef.current = urlSort;
      fetchEntitiesRef.current(1);
    }
  }, [urlSort]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch from page 1 when quick filter conditions change.
  // Using a previousFiltersKeyRef instead of isFirstRenderRef to safely skip the
  // initial run, because React 18 StrictMode preserves ref values across its
  // mount→unmount→remount cycle, which caused isFirstRenderRef to be false on
  // the second run and trigger a spurious reset to page 1.
  const previousFiltersKeyRef = useRef(filtersKey);
  useEffect(() => {
    if (filtersKey === previousFiltersKeyRef.current) {
      return;
    }
    previousFiltersKeyRef.current = filtersKey;
    setUrlPage(1);
    fetchEntitiesRef.current(1);
  }, [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapped pagination actions: update URL only; the effects above handle the actual fetch.
  const wrappedGoToPage = useCallback(
    async (page: number) => {
      setUrlPage(page);
    },
    [setUrlPage],
  );

  const wrappedNextPage = useCallback(async () => {
    if (entityListHook.hasNext) {
      setUrlPage(urlPage + 1);
    }
  }, [entityListHook.hasNext, urlPage, setUrlPage]);

  const wrappedPreviousPage = useCallback(async () => {
    if (entityListHook.hasPrevious) {
      setUrlPage(urlPage - 1);
    }
  }, [entityListHook.hasPrevious, urlPage, setUrlPage]);

  const wrappedGoToFirst = useCallback(async () => {
    setUrlPage(1);
  }, [setUrlPage]);

  const wrappedGoToLast = useCallback(async () => {
    setUrlPage(entityListHook.totalPages);
  }, [entityListHook.totalPages, setUrlPage]);

  // When searching, clear the page param so results start from the first page,
  // and persist the search term in sessionStorage so it can be restored on back-navigation.
  const wrappedSetSearchTerm = useCallback(
    (term: string) => {
      if (term) {
        sessionStorage.setItem(sessionSearchKey, term);
      } else {
        sessionStorage.removeItem(sessionSearchKey);
      }
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.delete('page');
          return next;
        },
        { replace: true },
      );
      entityListHook.setSearchTerm(term);
    },
    [setSearchParams, entityListHook.setSearchTerm, sessionSearchKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const patchedHook = useMemo(
    () => ({
      ...entityListHook,
      goToPage: wrappedGoToPage,
      nextPage: wrappedNextPage,
      previousPage: wrappedPreviousPage,
      goToFirst: wrappedGoToFirst,
      goToLast: wrappedGoToLast,
      setSearchTerm: wrappedSetSearchTerm,
    }),
    [
      entityListHook,
      wrappedGoToPage,
      wrappedNextPage,
      wrappedPreviousPage,
      wrappedGoToFirst,
      wrappedGoToLast,
      wrappedSetSearchTerm,
    ],
  );

  return { patchedHook, urlSort, handleSortChange };
};

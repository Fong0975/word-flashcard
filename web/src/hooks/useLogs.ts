import { useMemo } from 'react';

import { apiService } from '../lib/api';
import { LogEntry, LogLevel } from '../types/logs';
import { EntityListHook } from '../types/hooks';

import { useEntityList, UseEntityListOptions } from './useEntityList';

export interface UseLogsOptions {
  itemsPerPage?: number;
  initialPage?: number;
  autoFetch?: boolean;
  /** Level allow-list; empty or omitted means every level. */
  levels?: readonly LogLevel[];
  /** Inclusive lower bound, as `YYYY-MM-DD` or RFC3339. */
  from?: string;
  /** Inclusive upper bound; a plain date covers the whole day. */
  to?: string;
}

export interface UseLogsReturn extends EntityListHook<LogEntry> {
  logs: LogEntry[];
}

/**
 * Paginated access to the backend log files.
 *
 * Unlike the word/question lists there is no keyword search: the backend
 * filters on level and time range through query parameters, which are
 * carried in via the closures below rather than the `SearchFilter` body
 * those endpoints use. This mirrors how `useWords` passes `sort`.
 */
export const useLogs = (options: UseLogsOptions = {}): UseLogsReturn => {
  const {
    itemsPerPage = 50,
    initialPage = 1,
    autoFetch = true,
    levels,
    from,
    to,
  } = options;

  const entityListOptions = useMemo(
    (): UseEntityListOptions<LogEntry> => ({
      entityName: 'logs',
      apiService: {
        fetchList: params =>
          apiService.getLogs({
            limit: params.limit,
            offset: params.offset,
            levels,
            from,
            to,
          }),
        getCount: () => apiService.getLogsCount({ levels, from, to }),
      },
      searchConfig: { type: 'server' },
      itemsPerPage,
      initialPage,
      autoFetch,
    }),
    [itemsPerPage, initialPage, autoFetch, levels, from, to],
  );

  const entityListResult = useEntityList<LogEntry>(entityListOptions);

  return useMemo(
    (): UseLogsReturn => ({
      logs: entityListResult.entities,
      entities: entityListResult.entities,
      loading: entityListResult.loading,
      error: entityListResult.error,
      currentPage: entityListResult.currentPage,
      totalPages: entityListResult.totalPages,
      hasNext: entityListResult.hasNext,
      hasPrevious: entityListResult.hasPrevious,
      itemsPerPage: entityListResult.itemsPerPage,
      searchTerm: entityListResult.searchTerm,
      totalCount: entityListResult.totalCount,

      fetchEntities: entityListResult.fetchEntities,
      nextPage: entityListResult.nextPage,
      previousPage: entityListResult.previousPage,
      goToPage: entityListResult.goToPage,
      goToFirst: entityListResult.goToFirst,
      goToLast: entityListResult.goToLast,
      refresh: entityListResult.refresh,
      clearError: entityListResult.clearError,
      setSearchTerm: entityListResult.setSearchTerm,
    }),
    [entityListResult],
  );
};

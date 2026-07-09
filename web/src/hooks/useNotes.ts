import { useMemo } from 'react';

import { apiService } from '../lib/api';
import { Note } from '../types/api';
import { SearchFilter, SearchOperation, SearchLogic } from '../types/base';
import { EntityListHook } from '../types';

import { useEntityList, UseEntityListOptions } from './useEntityList';

export interface UseNotesState {
  notes: Note[];
}

export interface UseNotesActions {
  fetchNotes: (page?: number) => Promise<string | undefined>;
}

export interface UseNotesOptions {
  itemsPerPage?: number;
  initialPage?: number;
  autoFetch?: boolean;
}

export interface UseNotesReturn
  extends UseNotesState, UseNotesActions, EntityListHook<Note> {}

const createNotesSearchFilter = (
  searchTerm: string,
): SearchFilter | undefined => {
  if (!searchTerm.trim()) {
    return undefined;
  }
  return {
    conditions: [
      {
        key: 'title',
        operator: SearchOperation.LIKE,
        value: `%${searchTerm}%`,
      },
      {
        key: 'content',
        operator: SearchOperation.LIKE,
        value: `%${searchTerm}%`,
      },
    ],
    logic: SearchLogic.OR,
  };
};

export const useNotes = (options: UseNotesOptions = {}): UseNotesReturn => {
  const { itemsPerPage = 30, initialPage = 1, autoFetch = true } = options;

  const entityListOptions = useMemo(
    (): UseEntityListOptions<Note> => ({
      entityName: 'notes',
      apiService: {
        fetchList: params =>
          apiService.searchNotes({
            limit: params.limit,
            offset: params.offset,
            searchFilter: params.searchFilter,
          }),
        getCount: (_filter?: SearchFilter) => apiService.getNotesCount(),
      },
      searchConfig: {
        type: 'server',
        createSearchFilter: createNotesSearchFilter,
      },
      itemsPerPage,
      initialPage,
      autoFetch,
    }),
    [itemsPerPage, initialPage, autoFetch],
  );

  const entityListResult = useEntityList<Note>(entityListOptions);

  return useMemo(
    (): UseNotesReturn => ({
      entities: entityListResult.entities,
      notes: entityListResult.entities,
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
      fetchNotes: entityListResult.fetchEntities,
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

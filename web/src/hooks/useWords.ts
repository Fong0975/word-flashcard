import { useMemo } from 'react';

import { apiService } from '../lib/api';
import { Word } from '../types/api';
import { SearchFilter, SearchOperation, SearchLogic } from '../types/base';
import { EntityListHook } from '../types/hooks';

import { useEntityList, UseEntityListOptions } from './useEntityList';

// Keep the original interface for backward compatibility
export interface UseWordsState {
  words: Word[];
}

export interface UseWordsActions {
  fetchWords: (page?: number) => Promise<void>;
}

export interface UseWordsOptions {
  itemsPerPage?: number;
  initialPage?: number;
  autoFetch?: boolean;
}

export interface UseWordsReturn extends UseWordsState, UseWordsActions, EntityListHook<Word> {}

export const useWords = (options: UseWordsOptions = {}): UseWordsReturn => {
  const { itemsPerPage = 50, initialPage = 1, autoFetch = true } = options;

  // Create configuration for the generic hook
  const entityListOptions = useMemo((): UseEntityListOptions<Word> => ({
    entityName: 'words',
    apiService: {
      fetchList: (params) => apiService.searchWords(params),
      getCount: (searchFilter) => apiService.getWordsCount(searchFilter),
    },
    searchConfig: {
      type: 'server',
      createSearchFilter: (searchTerm: string): SearchFilter | undefined => {
        return searchTerm ? {
          conditions: [
            {
              key: 'word',
              operator: SearchOperation.LIKE,
              value: `%${searchTerm}%`,
            },
            {
              key: 'definition',
              operator: SearchOperation.LIKE,
              value: `%${searchTerm}%`,
            },
            {
              key: 'notes',
              operator: SearchOperation.LIKE,
              value: `%${searchTerm}%`,
            },
          ],
          logic: SearchLogic.OR,
        } : undefined;
      },
    },
    itemsPerPage,
    initialPage,
    autoFetch,
  }), [itemsPerPage, initialPage, autoFetch]);

  // Use the generic hook
  const entityListResult = useEntityList<Word>(entityListOptions);

  // Map the generic result to the specific Word interface
  return useMemo((): UseWordsReturn => ({
    // State mapping: entities -> words
    words: entityListResult.entities,
    entities: entityListResult.entities, // Add for EntityListHook compatibility
    loading: entityListResult.loading,
    error: entityListResult.error,
    currentPage: entityListResult.currentPage,
    totalPages: entityListResult.totalPages,
    hasNext: entityListResult.hasNext,
    hasPrevious: entityListResult.hasPrevious,
    itemsPerPage: entityListResult.itemsPerPage,
    searchTerm: entityListResult.searchTerm,
    totalCount: entityListResult.totalCount,

    // Actions mapping: fetchEntities -> fetchWords
    fetchWords: entityListResult.fetchEntities,
    fetchEntities: entityListResult.fetchEntities, // Add for EntityListHook compatibility
    nextPage: entityListResult.nextPage,
    previousPage: entityListResult.previousPage,
    goToPage: entityListResult.goToPage,
    goToFirst: entityListResult.goToFirst,
    goToLast: entityListResult.goToLast,
    refresh: entityListResult.refresh,
    clearError: entityListResult.clearError,
    setSearchTerm: entityListResult.setSearchTerm,
  }), [entityListResult]);
};
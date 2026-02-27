import { useState, useEffect, useCallback, useRef } from 'react';

import { ApiError } from '../lib/api';
import { SearchFilter, BaseEntity } from '../types/base';

/**
 * Generic hook for managing paginated entity lists (words, questions, etc.)
 *
 * This hook abstracts common list management functionality including:
 * - Pagination (next, previous, go to page)
 * - Loading states and error handling
 * - Search functionality (server-side or client-side)
 * - Auto-fetch capabilities
 *
 * @example
 * ```typescript
 * // Server-side search example (Words)
 * const wordsHook = useEntityList({
 *   entityName: 'words',
 *   apiService: {
 *     fetchList: (params) => apiService.searchWords(params),
 *     getCount: (filter) => apiService.getWordsCount(filter),
 *   },
 *   searchConfig: {
 *     type: 'server',
 *     createSearchFilter: (term) => ({ conditions: [...], logic: 'OR' })
 *   }
 * });
 *
 * // Client-side search example (Questions)
 * const questionsHook = useEntityList({
 *   entityName: 'questions',
 *   apiService: {
 *     fetchList: (params) => apiService.getAllQuestions(params),
 *     getCount: () => apiService.getQuestionsCount(),
 *   },
 *   searchConfig: {
 *     type: 'client',
 *     filterPredicate: (item, term) => item.name.includes(term)
 *   }
 * });
 * ```
 */

// Generic state interface
export interface UseEntityListState<T> {
  entities: T[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  itemsPerPage: number;
  searchTerm: string;
  totalCount: number;
}

// Generic actions interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface UseEntityListActions<T> {
  fetchEntities: (page?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  goToFirst: () => Promise<void>;
  goToLast: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
}

// Generic return interface
export interface UseEntityListReturn<T>
  extends UseEntityListState<T>, UseEntityListActions<T> {}

// Search configuration
export interface SearchConfig<T> {
  type: 'server' | 'client';
  // For server-side search: create SearchFilter function
  createSearchFilter?: (searchTerm: string) => SearchFilter | undefined;
  // For client-side search: filter predicate function
  filterPredicate?: (entity: T, searchTerm: string) => boolean;
}

// API service configuration
export interface ApiServiceConfig<T> {
  fetchList: (params: {
    limit: number;
    offset: number;
    searchFilter?: SearchFilter;
  }) => Promise<T[]>;
  getCount: (searchFilter?: SearchFilter) => Promise<{ count: number }>;
}

// Hook options
export interface UseEntityListOptions<T> {
  entityName: string; // For error messages: e.g., "words", "questions"
  apiService: ApiServiceConfig<T>;
  searchConfig: SearchConfig<T>;
  itemsPerPage?: number;
  initialPage?: number;
  autoFetch?: boolean;
}

export const useEntityList = <T extends BaseEntity>(
  options: UseEntityListOptions<T>,
): UseEntityListReturn<T> => {
  const {
    entityName,
    apiService,
    searchConfig,
    itemsPerPage = 50,
    initialPage = 1,
    autoFetch = true,
  } = options;

  const [state, setState] = useState<UseEntityListState<T>>({
    entities: [],
    loading: false,
    error: null,
    currentPage: initialPage,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
    itemsPerPage,
    searchTerm: '',
    totalCount: 0,
  });

  const mounted = useRef(false);
  const previousSearchTerm = useRef('');

  const fetchEntities = useCallback(
    async (page?: number) => {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const targetPage = page ?? state.currentPage;
        const offset = (targetPage - 1) * itemsPerPage;

        // Create search filter for server-side search
        const searchFilter =
          searchConfig.type === 'server' && searchConfig.createSearchFilter
            ? searchConfig.createSearchFilter(state.searchTerm)
            : undefined;

        const params = {
          limit: itemsPerPage,
          offset,
          ...(searchFilter && { searchFilter }),
        };

        // Get entities and total count in parallel for better performance
        const [entitiesResponse, countResponse] = await Promise.all([
          apiService.fetchList(params),
          apiService.getCount(searchFilter),
        ]);

        let entities = entitiesResponse;
        if (entities === null || !Array.isArray(entities)) {
          entities = [];
        }

        // Get the total count from the API response
        const totalCount = countResponse.count || 0;

        // Apply client-side filtering if configured
        if (
          searchConfig.type === 'client' &&
          state.searchTerm &&
          searchConfig.filterPredicate
        ) {
          entities = entities.filter(entity =>
            searchConfig.filterPredicate!(entity, state.searchTerm),
          );
        }

        // Calculate pagination info based on real total count
        const totalPages = Math.ceil(totalCount / itemsPerPage);
        const hasNext = targetPage < totalPages;
        const hasPrevious = targetPage > 1;

        setState(prev => ({
          ...prev,
          entities,
          loading: false,
          currentPage: targetPage,
          totalPages,
          hasNext,
          hasPrevious,
          totalCount,
        }));
      } catch (error) {
        let errorMessage = `Failed to fetch ${entityName}`;

        if (error instanceof ApiError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          entities: [],
          totalCount: 0,
        }));
      }
    },
    [
      state.currentPage,
      state.searchTerm,
      itemsPerPage,
      entityName,
      apiService,
      searchConfig,
    ],
  );

  const nextPage = useCallback(async () => {
    if (state.hasNext && !state.loading) {
      await fetchEntities(state.currentPage + 1);
    }
  }, [state.hasNext, state.loading, state.currentPage, fetchEntities]);

  const previousPage = useCallback(async () => {
    if (state.hasPrevious && !state.loading) {
      await fetchEntities(state.currentPage - 1);
    }
  }, [state.hasPrevious, state.loading, state.currentPage, fetchEntities]);

  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 1 && page <= state.totalPages && !state.loading) {
        await fetchEntities(page);
      }
    },
    [state.totalPages, state.loading, fetchEntities],
  );

  const goToFirst = useCallback(async () => {
    if (state.currentPage > 1 && !state.loading) {
      await fetchEntities(1);
    }
  }, [state.currentPage, state.loading, fetchEntities]);

  const goToLast = useCallback(async () => {
    if (state.currentPage < state.totalPages && !state.loading) {
      await fetchEntities(state.totalPages);
    }
  }, [state.currentPage, state.totalPages, state.loading, fetchEntities]);

  const refresh = useCallback(async () => {
    await fetchEntities(state.currentPage);
  }, [state.currentPage, fetchEntities]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({
      ...prev,
      searchTerm: term,
      currentPage: 1, // Reset to first page when searching
      totalPages: 1,
      totalCount: 0,
    }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && !mounted.current) {
      mounted.current = true;
      fetchEntities(initialPage);
    }
  }, [autoFetch, initialPage, fetchEntities]);

  // Re-fetch when search term changes
  useEffect(() => {
    if (autoFetch && state.searchTerm !== previousSearchTerm.current) {
      previousSearchTerm.current = state.searchTerm;
      if (mounted.current) {
        fetchEntities(1); // Reset to page 1 when searching
      }
    }
  }, [state.searchTerm, autoFetch, fetchEntities]);

  return {
    // State
    ...state,
    // Actions
    fetchEntities,
    nextPage,
    previousPage,
    goToPage,
    goToFirst,
    goToLast,
    refresh,
    clearError,
    setSearchTerm,
  };
};

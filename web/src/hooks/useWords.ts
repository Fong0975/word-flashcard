import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, ApiError } from '../lib/api';
import { Word, SearchFilter } from '../types/api';

export interface UseWordsState {
  words: Word[];
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

export interface UseWordsActions {
  fetchWords: (page?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
}

export interface UseWordsOptions {
  itemsPerPage?: number;
  initialPage?: number;
  autoFetch?: boolean;
}

export interface UseWordsReturn extends UseWordsState, UseWordsActions {}

export const useWords = (options: UseWordsOptions = {}): UseWordsReturn => {
  const {
    itemsPerPage = 50,
    initialPage = 1,
    autoFetch = true,
  } = options;

  const [state, setState] = useState<UseWordsState>({
    words: [],
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

  const fetchWords = useCallback(async (page?: number) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const targetPage = page ?? state.currentPage;
      const offset = (targetPage - 1) * itemsPerPage;

      // Create search filter if there is a search term
      const searchFilter: SearchFilter | undefined = state.searchTerm
        ? {
            conditions: [
              {
                key: 'word',
                operator: 'like',
                value: `%${state.searchTerm}%`,
              },
              {
                key: 'definition',
                operator: 'like',
                value: `%${state.searchTerm}%`,
              },
              {
                key: 'notes',
                operator: 'like',
                value: `%${state.searchTerm}%`,
              },
            ],
            logic: 'OR',
          }
        : undefined;

      const params = {
        limit: itemsPerPage,
        offset,
        searchFilter,
      };

      // Get words and total count in parallel for better performance
      const [wordsResponse, countResponse] = await Promise.all([
        apiService.searchWords(params),
        apiService.getWordsCount(searchFilter)
      ]);

      let words = wordsResponse;
      if (words == null || !Array.isArray(words)) {
        words = [];
      }

      // Get the total count from the API response
      const totalCount = countResponse.count || 0;

      // Calculate pagination info based on real total count
      const totalPages = Math.ceil(totalCount / itemsPerPage);
      const hasNext = targetPage < totalPages;
      const hasPrevious = targetPage > 1;

      setState(prev => ({
        ...prev,
        words,
        loading: false,
        currentPage: targetPage,
        totalPages,
        hasNext,
        hasPrevious,
        totalCount,
      }));

    } catch (error) {
      let errorMessage = 'Failed to fetch words';

      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        words: [],
        totalCount: 0,
      }));
    }
  }, [state.currentPage, state.searchTerm, itemsPerPage]);

  const nextPage = useCallback(async () => {
    if (state.hasNext && !state.loading) {
      await fetchWords(state.currentPage + 1);
    }
  }, [state.hasNext, state.loading, state.currentPage, fetchWords]);

  const previousPage = useCallback(async () => {
    if (state.hasPrevious && !state.loading) {
      await fetchWords(state.currentPage - 1);
    }
  }, [state.hasPrevious, state.loading, state.currentPage, fetchWords]);

  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= state.totalPages && !state.loading) {
      await fetchWords(page);
    }
  }, [state.totalPages, state.loading, fetchWords]);

  const refresh = useCallback(async () => {
    await fetchWords(state.currentPage);
  }, [state.currentPage, fetchWords]);

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
      fetchWords(initialPage);
    }
  }, [autoFetch, initialPage, fetchWords]);

  // Re-fetch when search term changes
  useEffect(() => {
    if (autoFetch && state.searchTerm !== previousSearchTerm.current) {
      previousSearchTerm.current = state.searchTerm;
      if (mounted.current) {
        fetchWords(1); // Reset to page 1 when searching
      }
    }
  }, [state.searchTerm, autoFetch, fetchWords]);

  return {
    // State
    ...state,
    // Actions
    fetchWords,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    clearError,
    setSearchTerm,
  };
};
import { useState, useEffect, useCallback } from 'react';
import { apiService, ApiError } from '../lib/api';
import { Word, WordsQueryParams } from '../types/api';

export interface UseWordsState {
  words: Word[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  itemsPerPage: number;
}

export interface UseWordsActions {
  fetchWords: (page?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
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
  });

  const fetchWords = useCallback(async (page?: number) => {
    const targetPage = page ?? state.currentPage;
    const offset = (targetPage - 1) * itemsPerPage;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const params: WordsQueryParams = {
        limit: itemsPerPage,
        offset,
      };

      let words = await apiService.getWords(params);
      if (words == null || !Array.isArray(words)) {
        words = [];
      }

      // Calculate pagination info
      // Note: Since API doesn't return total count, we estimate based on returned data
      const hasNext = words.length === itemsPerPage;
      const hasPrevious = targetPage > 1;

      // Estimate total pages (this is a rough estimation)
      // In a real scenario, the API should return total count
      const estimatedTotalPages = hasNext
        ? Math.max(targetPage + 1, state.totalPages)
        : targetPage;

      setState(prev => ({
        ...prev,
        words,
        loading: false,
        currentPage: targetPage,
        totalPages: estimatedTotalPages,
        hasNext,
        hasPrevious,
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
      }));
    }
  }, [state.currentPage, itemsPerPage]);

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

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchWords(initialPage);
    }
  }, [autoFetch, initialPage, fetchWords]);

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
  };
};
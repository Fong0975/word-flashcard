import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, ApiError } from '../lib/api';
import { Question } from '../types/api';

export interface UseQuestionsState {
  questions: Question[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  itemsPerPage: number;
  searchTerm: string;
}

export interface UseQuestionsActions {
  fetchQuestions: (page?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
}

export interface UseQuestionsOptions {
  itemsPerPage?: number;
  initialPage?: number;
  autoFetch?: boolean;
}

export interface UseQuestionsReturn extends UseQuestionsState, UseQuestionsActions {}

export const useQuestions = (options: UseQuestionsOptions = {}): UseQuestionsReturn => {
  const {
    itemsPerPage = 50, // Same as words for consistency
    initialPage = 1,
    autoFetch = true,
  } = options;

  const [state, setState] = useState<UseQuestionsState>({
    questions: [],
    loading: false,
    error: null,
    currentPage: initialPage,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
    itemsPerPage,
    searchTerm: '',
  });

  const mounted = useRef(false);
  const previousSearchTerm = useRef('');

  const fetchQuestions = useCallback(async (page?: number) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const targetPage = page ?? state.currentPage;
      const offset = (targetPage - 1) * itemsPerPage;

      const params = {
        limit: itemsPerPage,
        offset,
      };

      // Get questions and total count in parallel for better performance
      const [questionsResponse, countResponse] = await Promise.all([
        apiService.getAllQuestions(params),
        apiService.getQuestionsCount()
      ]);

      let questions = questionsResponse;
      if (questions == null || !Array.isArray(questions)) {
        questions = [];
      }

      // Get the total count from the API response
      const totalCount = countResponse.count || 0;

      // If there's a search term, filter the results client-side
      // This is a temporary solution until server-side search is implemented
      if (state.searchTerm) {
        const searchTermLower = state.searchTerm.toLowerCase();
        questions = questions.filter(question =>
          question.question.toLowerCase().includes(searchTermLower) ||
          question.option_a.toLowerCase().includes(searchTermLower) ||
          (question.option_b && question.option_b.toLowerCase().includes(searchTermLower)) ||
          (question.option_c && question.option_c.toLowerCase().includes(searchTermLower)) ||
          (question.option_d && question.option_d.toLowerCase().includes(searchTermLower))
        );
      }

      // Calculate pagination info based on real total count
      const totalPages = Math.ceil(totalCount / itemsPerPage);
      const hasNext = targetPage < totalPages;
      const hasPrevious = targetPage > 1;

      setState(prev => ({
        ...prev,
        questions,
        loading: false,
        currentPage: targetPage,
        totalPages,
        hasNext,
        hasPrevious,
      }));

    } catch (error) {
      let errorMessage = 'Failed to fetch questions';

      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        questions: [],
      }));
    }
  }, [state.currentPage, state.searchTerm, itemsPerPage]);

  const nextPage = useCallback(async () => {
    if (state.hasNext && !state.loading) {
      await fetchQuestions(state.currentPage + 1);
    }
  }, [state.hasNext, state.loading, state.currentPage, fetchQuestions]);

  const previousPage = useCallback(async () => {
    if (state.hasPrevious && !state.loading) {
      await fetchQuestions(state.currentPage - 1);
    }
  }, [state.hasPrevious, state.loading, state.currentPage, fetchQuestions]);

  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= state.totalPages && !state.loading) {
      await fetchQuestions(page);
    }
  }, [state.totalPages, state.loading, fetchQuestions]);

  const refresh = useCallback(async () => {
    await fetchQuestions(state.currentPage);
  }, [state.currentPage, fetchQuestions]);

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
    }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && !mounted.current) {
      mounted.current = true;
      fetchQuestions(initialPage);
    }
  }, [autoFetch, initialPage, fetchQuestions]);

  // Re-fetch when search term changes
  useEffect(() => {
    if (autoFetch && state.searchTerm !== previousSearchTerm.current) {
      previousSearchTerm.current = state.searchTerm;
      if (mounted.current) {
        fetchQuestions(1); // Reset to page 1 when searching
      }
    }
  }, [state.searchTerm, autoFetch, fetchQuestions]);

  return {
    // State
    ...state,
    // Actions
    fetchQuestions,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    clearError,
    setSearchTerm,
  };
};
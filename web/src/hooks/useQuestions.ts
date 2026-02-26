import { useMemo } from 'react';

import { apiService } from '../lib/api';
import { Question } from '../types/api';
import { EntityListHook } from '../types';

import { useEntityList, UseEntityListOptions } from './useEntityList';

// Keep the original interface for backward compatibility
export interface UseQuestionsState {
  questions: Question[];
}

export interface UseQuestionsActions {
  fetchQuestions: (page?: number) => Promise<void>;
}

export interface UseQuestionsOptions {
  itemsPerPage?: number;
  initialPage?: number;
  autoFetch?: boolean;
}

export interface UseQuestionsReturn extends UseQuestionsState, UseQuestionsActions, EntityListHook<Question> {}

export const useQuestions = (options: UseQuestionsOptions = {}): UseQuestionsReturn => {
  const { itemsPerPage = 20, initialPage = 1, autoFetch = true } = options;

  // Create configuration for the generic hook
  const entityListOptions = useMemo((): UseEntityListOptions<Question> => ({
    entityName: 'questions',
    apiService: {
      fetchList: (params) => apiService.getAllQuestions(params),
      getCount: () => apiService.getQuestionsCount(),
    },
    searchConfig: {
      type: 'client',
      filterPredicate: (question: Question, searchTerm: string): boolean => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          question.question.toLowerCase().includes(searchTermLower) ||
          question.option_a.toLowerCase().includes(searchTermLower) ||
          !!(question.option_b && question.option_b.toLowerCase().includes(searchTermLower)) ||
          !!(question.option_c && question.option_c.toLowerCase().includes(searchTermLower)) ||
          !!(question.option_d && question.option_d.toLowerCase().includes(searchTermLower))
        );
      },
    },
    itemsPerPage,
    initialPage,
    autoFetch,
  }), [itemsPerPage, initialPage, autoFetch]);

  // Use the generic hook
  const entityListResult = useEntityList<Question>(entityListOptions);

  // Map the generic result to the specific Question interface
  return useMemo((): UseQuestionsReturn => ({
    // State mapping: entities -> questions (keep both for compatibility)
    entities: entityListResult.entities, // Standard EntityListHook interface
    questions: entityListResult.entities, // Backward compatibility
    loading: entityListResult.loading,
    error: entityListResult.error,
    currentPage: entityListResult.currentPage,
    totalPages: entityListResult.totalPages,
    hasNext: entityListResult.hasNext,
    hasPrevious: entityListResult.hasPrevious,
    itemsPerPage: entityListResult.itemsPerPage,
    searchTerm: entityListResult.searchTerm,
    totalCount: entityListResult.totalCount,

    // Actions mapping: fetchEntities -> fetchQuestions (keep both for compatibility)
    fetchEntities: entityListResult.fetchEntities, // Standard EntityListHook interface
    fetchQuestions: entityListResult.fetchEntities, // Backward compatibility
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
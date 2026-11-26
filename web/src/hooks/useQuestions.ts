import { useMemo, useRef } from 'react';

import { apiService } from '../lib/api';
import { Question } from '../types/api';
import {
  SearchCondition,
  SearchFilter,
  SearchOperation,
  SearchLogic,
} from '../types/base';
import { EntityListHook } from '../types';
import { escapeLikePattern } from '../utils/searchFilters';

import { useEntityList, UseEntityListOptions } from './useEntityList';

// Keep the original interface for backward compatibility
export interface UseQuestionsState {
  questions: Question[];
}

export interface UseQuestionsActions {
  fetchQuestions: (page?: number) => Promise<string | undefined>;
}

export interface UseQuestionsOptions {
  itemsPerPage?: number;
  initialPage?: number;
  initialSearchTerm?: string;
  autoFetch?: boolean;
  /**
   * Additional filter conditions to AND with keyword search results. Pass a
   * stable reference, as a new one rebuilds the search.
   */
  extraConditions?: readonly SearchCondition[];
  sort?: string;
}

export interface UseQuestionsReturn
  extends UseQuestionsState, UseQuestionsActions, EntityListHook<Question> {}

const SEARCHABLE_QUESTION_KEYS = [
  'question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
] as const;

/**
 * Builds a filter matching questions whose text or any answer option contains
 * the whole search term, narrowed by any extra conditions.
 *
 * A filter has a single logic operator, so it cannot OR the keyword across
 * fields and also AND the extra conditions. With extra conditions, the keyword
 * is therefore matched against the question text only.
 *
 * @param searchTerm - Raw search input; surrounding whitespace is ignored.
 * @param extraConditions - Conditions every result must also satisfy.
 * @returns The filter, or `undefined` when there is nothing to filter by.
 */
const createQuestionsSearchFilter = (
  searchTerm: string,
  extraConditions: readonly SearchCondition[] = [],
): SearchFilter | undefined => {
  const hasExtra = extraConditions.length > 0;
  const keyword = searchTerm.trim();
  const keywordKeys = hasExtra
    ? (['question'] as const)
    : SEARCHABLE_QUESTION_KEYS;
  const value = `%${escapeLikePattern(keyword)}%`;
  const keywordConditions: SearchCondition[] = keyword
    ? keywordKeys.map(key => ({ key, operator: SearchOperation.LIKE, value }))
    : [];

  const conditions = [...keywordConditions, ...extraConditions];
  if (conditions.length === 0) {
    return undefined;
  }

  return { conditions, logic: hasExtra ? SearchLogic.AND : SearchLogic.OR };
};

export const useQuestions = (
  options: UseQuestionsOptions = {},
): UseQuestionsReturn => {
  const {
    itemsPerPage = 20,
    initialPage = 1,
    initialSearchTerm = '',
    autoFetch = true,
    extraConditions,
    sort,
  } = options;

  // Use a ref so the fetchList closure always reads the latest sort value
  // without needing to be recreated when sort changes.
  const sortRef = useRef(sort);
  sortRef.current = sort;

  // Create configuration for the generic hook
  const entityListOptions = useMemo(
    (): UseEntityListOptions<Question> => ({
      entityName: 'questions',
      apiService: {
        fetchList: params =>
          apiService.searchQuestions({ ...params, sort: sortRef.current }),
        getCount: searchFilter => apiService.getQuestionsCount(searchFilter),
      },
      searchConfig: {
        type: 'server',
        createSearchFilter: searchTerm =>
          createQuestionsSearchFilter(searchTerm, extraConditions),
      },
      itemsPerPage,
      initialPage,
      initialSearchTerm,
      autoFetch,
    }),
    [itemsPerPage, initialPage, initialSearchTerm, autoFetch, extraConditions],
  );

  // Use the generic hook
  const entityListResult = useEntityList<Question>(entityListOptions);

  // Map the generic result to the specific Question interface
  return useMemo(
    (): UseQuestionsReturn => ({
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
    }),
    [entityListResult],
  );
};

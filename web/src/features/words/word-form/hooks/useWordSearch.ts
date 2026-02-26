import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../../../../lib/api';
import { Word } from '../../../../types/api';
import { WordSearchState } from '../types';
import { createWordSearchFilter, filterSearchSuggestions } from '../utils';
import { MAX_SUGGESTIONS, SEARCH_DEBOUNCE_MS } from '../utils/constants';
import { useDebounce } from './useDebounce';

interface UseWordSearchProps {
  mode: 'create' | 'edit';
  editingWord?: Word;
}

export const useWordSearch = ({ mode, editingWord }: UseWordSearchProps) => {
  const [searchState, setSearchState] = useState<WordSearchState>({
    suggestions: [],
    isLoading: false,
    showSuggestions: false
  });

  // Search for similar words
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchState({
        suggestions: [],
        isLoading: false,
        showSuggestions: false
      });
      return;
    }

    setSearchState(prev => ({ ...prev, isLoading: true }));

    try {
      const searchFilter = createWordSearchFilter(searchTerm);
      const results = await apiService.searchWords({
        searchFilter,
        limit: MAX_SUGGESTIONS,
      });

      // Filter out exact matches and current editing word
      const filteredResults = filterSearchSuggestions(
        results,
        searchTerm,
        mode,
        editingWord
      );

      setSearchState({
        suggestions: filteredResults,
        isLoading: false,
        showSuggestions: filteredResults.length > 0
      });
    } catch (err) {
      console.error('Failed to search similar words:', err);
      setSearchState({
        suggestions: [],
        isLoading: false,
        showSuggestions: false
      });
    }
  }, [mode, editingWord]);

  // Debounced search function
  const { debouncedCallback: debouncedSearch, cleanup } = useDebounce(
    performSearch,
    SEARCH_DEBOUNCE_MS
  );

  // Handle word input change
  const handleWordChange = useCallback((value: string) => {
    if (value.trim()) {
      debouncedSearch(value.trim());
    } else {
      setSearchState({
        suggestions: [],
        isLoading: false,
        showSuggestions: false
      });
    }
  }, [debouncedSearch]);

  // Reset search state
  const resetSearch = useCallback(() => {
    setSearchState({
      suggestions: [],
      isLoading: false,
      showSuggestions: false
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    searchState,
    handleWordChange,
    resetSearch,
    cleanup
  };
};
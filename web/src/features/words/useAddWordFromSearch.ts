import { useCallback, useState } from 'react';

import { apiService } from '../../lib/api';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { Word } from '../../types/api';
import { createExactWordSearchFilter } from '../../utils/searchFilters';

/**
 * Whether the list contains a word whose `word` field equals the term
 * (case-insensitive). Hits on other fields do not count as a match.
 */
export const hasExactWordMatch = (words: readonly Word[], term: string) => {
  const normalized = term.trim().toLowerCase();
  return words.some(w => w.word.toLowerCase() === normalized);
};

interface UseAddWordFromSearchProps {
  onAdded: (word: Word) => void;
  onError: (message: string) => void;
}

/**
 * Drives the "add the searched word" flow: request -> user confirmation ->
 * duplicate check -> create word -> `onAdded` (e.g. navigate to detail).
 */
export const useAddWordFromSearch = ({
  onAdded,
  onError,
}: UseAddWordFromSearchProps) => {
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const requestAdd = useCallback((term: string) => {
    const trimmed = term.trim();
    if (trimmed) {
      setPendingWord(trimmed);
    }
  }, []);

  const cancelAdd = useCallback(() => {
    setPendingWord(null);
  }, []);

  const confirmAdd = useCallback(async () => {
    if (!pendingWord) {
      return;
    }

    setIsAdding(true);
    try {
      const existing = await apiService.searchWords({
        searchFilter: createExactWordSearchFilter(pendingWord),
        limit: 1,
      });
      if (
        existing.some(w => w.word.toLowerCase() === pendingWord.toLowerCase())
      ) {
        onError(`Word "${pendingWord}" already exists`);
        setPendingWord(null);
        return;
      }

      const created = await apiService.createWord({ word: pendingWord });
      setPendingWord(null);
      onAdded(created);
    } catch (err: unknown) {
      onError(getApiErrorMessage(err, 'Failed to create word'));
      setPendingWord(null);
    } finally {
      setIsAdding(false);
    }
  }, [pendingWord, onAdded, onError]);

  return { pendingWord, isAdding, requestAdd, cancelAdd, confirmAdd };
};

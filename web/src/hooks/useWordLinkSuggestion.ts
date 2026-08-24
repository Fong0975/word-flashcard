import { useState, useRef, useCallback, useEffect } from 'react';

import {
  BacktickWordMatch,
  detectCompletedBacktickWord,
  hasWordLinkAfter,
} from '../components/ui/markdown-editor/wordLinkFormatting';
import { apiService } from '../lib/api';
import { createExactWordSearchFilter } from '../utils/searchFilters';

import { useDebounce } from './useDebounce';

const WORD_LINK_LOOKUP_DEBOUNCE_MS = 300;

export interface WordLinkSuggestion {
  word: string;
  insertPosition: number;
}

interface UseWordLinkSuggestionResult {
  suggestion: WordLinkSuggestion | null;
  /** Call on every editor change with the latest value and cursor position. */
  notifyChange: (value: string, cursorPosition: number) => void;
  /** Dismisses the current suggestion and prevents it from re-appearing for the same word. */
  dismissSuggestion: () => void;
}

/**
 * Detects a backtick-wrapped word (e.g. `` `apple` ``) as it's completed while
 * typing, and looks up whether it's already a saved word so the caller can
 * offer to insert a `/word/{word}` markdown link right after it.
 */
export const useWordLinkSuggestion = (): UseWordLinkSuggestionResult => {
  const [suggestion, setSuggestion] = useState<WordLinkSuggestion | null>(null);
  const dismissedWordsRef = useRef<Set<string>>(new Set());
  const latestMatchRef = useRef<BacktickWordMatch | null>(null);

  const performLookup = useCallback(async (match: BacktickWordMatch) => {
    try {
      const results = await apiService.searchWords({
        searchFilter: createExactWordSearchFilter(match.word),
      });

      // Discard a stale response if a newer candidate has since been detected.
      if (latestMatchRef.current !== match) {
        return;
      }

      const isKnownWord = results.some(
        w => w.word.toLowerCase() === match.word.toLowerCase(),
      );
      if (isKnownWord) {
        setSuggestion({
          word: match.word,
          insertPosition: match.closeIndex + 1,
        });
      }
    } catch {
      // Non-blocking hint feature: silently ignore lookup failures.
    }
  }, []);

  const { debouncedCallback: debouncedLookup, cleanup } = useDebounce(
    performLookup,
    WORD_LINK_LOOKUP_DEBOUNCE_MS,
  );

  const notifyChange = useCallback(
    (value: string, cursorPosition: number) => {
      // Any further edit invalidates a currently shown suggestion.
      setSuggestion(null);

      const match = detectCompletedBacktickWord(value, cursorPosition);
      latestMatchRef.current = match;

      if (!match) {
        return;
      }
      if (dismissedWordsRef.current.has(match.word.toLowerCase())) {
        return;
      }
      if (hasWordLinkAfter(value, match.closeIndex + 1)) {
        return;
      }

      debouncedLookup(match);
    },
    [debouncedLookup],
  );

  const dismissSuggestion = useCallback(() => {
    setSuggestion(current => {
      if (current) {
        dismissedWordsRef.current.add(current.word.toLowerCase());
      }
      return null;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { suggestion, notifyChange, dismissSuggestion };
};

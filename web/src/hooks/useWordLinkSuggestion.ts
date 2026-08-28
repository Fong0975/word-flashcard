import { useState, useRef, useCallback, useEffect } from 'react';

import {
  BacktickWordMatch,
  detectCompletedBacktickWord,
  findAllBacktickWords,
  hasWordLinkAfter,
} from '../components/ui/markdown-editor/wordLinkFormatting';
import { apiService } from '../lib/api';
import { createExactWordSearchFilter } from '../utils/searchFilters';

import { useDebounce } from './useDebounce';

const WORD_LINK_LOOKUP_DEBOUNCE_MS = 300;

/** Whether `word` is already a saved word, via an exact (case-insensitive) match. */
const checkWordExists = async (word: string): Promise<boolean> => {
  const results = await apiService.searchWords({
    searchFilter: createExactWordSearchFilter(word),
  });
  return results.some(w => w.word.toLowerCase() === word.toLowerCase());
};

export interface WordLinkSuggestion {
  word: string;
  insertPosition: number;
}

export interface WordLinkQueueProgress {
  current: number;
  total: number;
}

interface PendingQueueItem {
  word: string;
  /**
   * 1-based display order among the resolved known-word candidates only,
   * fixed once resolution completes; independent of later text-offset
   * shifts.
   */
  index: number;
}

interface UseWordLinkSuggestionResult {
  suggestion: WordLinkSuggestion | null;
  /** Non-null only while cascading through blur-detected missed suggestions. */
  queueProgress: WordLinkQueueProgress | null;
  /** Call on every editor change with the latest value and cursor position. */
  notifyChange: (value: string, cursorPosition: number) => void;
  /**
   * Call when the editor loses focus; scans the full text for missed
   * suggestions.
   */
  notifyBlur: (value: string) => void;
  /**
   * Dismisses the current suggestion, prevents it from re-appearing for the
   * same word, and continues any pending blur-detected queue using the
   * latest value.
   */
  dismissSuggestion: (value: string) => void;
}

/**
 * Detects a backtick-wrapped word (e.g. `` `apple` ``) as it's completed while
 * typing, and looks up whether it's already a saved word so the caller can
 * offer to insert a `/word/{word}` markdown link right after it.
 *
 * Also supports a full-text sweep on blur (`notifyBlur`) to catch pairs the
 * typing-driven detection missed — e.g. pasting a word into an existing empty
 * `` ` ` `` pair, where the cursor never lands right after the closing
 * backtick. Multiple missed candidates are surfaced one at a time via
 * `queueProgress`, advancing each time `dismissSuggestion` is called.
 */
export const useWordLinkSuggestion = (): UseWordLinkSuggestionResult => {
  const [suggestion, setSuggestion] = useState<WordLinkSuggestion | null>(null);
  const [queueProgress, setQueueProgress] =
    useState<WordLinkQueueProgress | null>(null);
  const dismissedWordsRef = useRef<Set<string>>(new Set());
  const latestMatchRef = useRef<BacktickWordMatch | null>(null);
  const pendingQueueRef = useRef<PendingQueueItem[]>([]);
  const queueTotalRef = useRef(0);
  const queueTokenRef = useRef(0);

  const performLookup = useCallback(async (match: BacktickWordMatch) => {
    try {
      const isKnownWord = await checkWordExists(match.word);

      // Discard a stale response if a newer candidate has since been detected.
      if (latestMatchRef.current !== match) {
        return;
      }

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

  const {
    debouncedCallback: debouncedLookup,
    cancel,
    cleanup,
  } = useDebounce(performLookup, WORD_LINK_LOOKUP_DEBOUNCE_MS);

  /**
   * Pops known-word candidates off the (already-resolved) queue and shows
   * the next one, re-locating its position in the current value rather than
   * reusing the offset captured at scan time — an earlier insertion in this
   * same cascade may have shifted later candidates. `queueProgress.total`
   * only ever counts candidates already confirmed to be known words, so it
   * reads as "suggestion N of M suggestions", never "candidate N of M
   * candidates in the text" (most of which may not pan out).
   */
  const showNextInQueue = useCallback((value: string, token: number) => {
    while (pendingQueueRef.current.length > 0) {
      if (token !== queueTokenRef.current) {
        return;
      }

      const item = pendingQueueRef.current.shift()!;
      if (dismissedWordsRef.current.has(item.word.toLowerCase())) {
        continue;
      }

      const freshMatch = findAllBacktickWords(value).find(
        m =>
          m.word.toLowerCase() === item.word.toLowerCase() &&
          !hasWordLinkAfter(value, m.closeIndex + 1),
      );
      if (!freshMatch) {
        continue;
      }

      setSuggestion({
        word: freshMatch.word,
        insertPosition: freshMatch.closeIndex + 1,
      });
      setQueueProgress({ current: item.index, total: queueTotalRef.current });
      return;
    }

    setQueueProgress(null);
  }, []);

  /**
   * Sequentially checks every candidate (no debounce — blur is a single
   * discrete event, not a burst of keystrokes) and resolves the *entire*
   * known-word subset before showing anything, so the progress count is
   * fixed upfront instead of growing/shrinking as later candidates turn out
   * to be unknown. Candidates that fail lookup or turn out unknown are
   * silently dropped rather than counted.
   */
  const resolveQueue = useCallback(
    async (value: string, words: string[], token: number) => {
      const knownWords: string[] = [];

      for (const word of words) {
        if (token !== queueTokenRef.current) {
          return;
        }
        if (dismissedWordsRef.current.has(word.toLowerCase())) {
          continue;
        }

        let isKnownWord: boolean;
        try {
          isKnownWord = await checkWordExists(word);
        } catch {
          continue;
        }

        if (token !== queueTokenRef.current) {
          return;
        }
        if (isKnownWord) {
          knownWords.push(word);
        }
      }

      queueTotalRef.current = knownWords.length;
      pendingQueueRef.current = knownWords.map((word, i) => ({
        word,
        index: i + 1,
      }));
      showNextInQueue(value, token);
    },
    [showNextInQueue],
  );

  const notifyChange = useCallback(
    (value: string, cursorPosition: number) => {
      // Any further edit invalidates a currently shown suggestion and cancels
      // any in-progress blur-detected queue.
      setSuggestion(null);
      setQueueProgress(null);
      pendingQueueRef.current = [];
      queueTokenRef.current += 1;

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

  const notifyBlur = useCallback(
    (value: string) => {
      // A suggestion is already on screen — either from the typing flow or a
      // previous blur scan — most likely because this blur was itself caused
      // by the user clicking that suggestion's own "Add link"/"Skip" button
      // (which blurs the textarea before the click fires). Don't start a
      // redundant rescan against the not-yet-updated value; let
      // dismissSuggestion drive the queue forward instead.
      if (suggestion) {
        return;
      }

      cancel();
      latestMatchRef.current = null;
      const token = ++queueTokenRef.current;

      const seen = new Set<string>();
      const candidates = findAllBacktickWords(value).filter(m => {
        const key = m.word.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        if (dismissedWordsRef.current.has(key)) {
          return false;
        }
        if (hasWordLinkAfter(value, m.closeIndex + 1)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      void resolveQueue(
        value,
        candidates.map(m => m.word),
        token,
      );
    },
    [suggestion, cancel, resolveQueue],
  );

  const dismissSuggestion = useCallback(
    (value: string) => {
      setSuggestion(current => {
        if (current) {
          dismissedWordsRef.current.add(current.word.toLowerCase());
        }
        return null;
      });
      // The rest of the queue was already resolved to known words upfront —
      // just advance to the next one, no further lookups needed.
      showNextInQueue(value, queueTokenRef.current);
    },
    [showNextInQueue],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      queueTokenRef.current += 1;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    suggestion,
    queueProgress,
    notifyChange,
    notifyBlur,
    dismissSuggestion,
  };
};

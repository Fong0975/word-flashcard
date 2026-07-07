import { useState, useEffect, useRef } from 'react';

const DEFAULT_DEBOUNCE_MS = 300;

interface UseDebouncedSearchInputOptions {
  searchTerm: string;
  onCommit: (term: string) => void;
  debounceMs?: number;
}

interface UseDebouncedSearchInputReturn {
  inputValue: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: (
    event: React.CompositionEvent<HTMLInputElement>,
  ) => void;
  clearSearch: () => void;
}

/**
 * A search input's displayed value is kept separate from the committed
 * search term so that a controlled re-render doesn't overwrite the DOM
 * value mid-IME composition (iOS Zhuyin/Pinyin aborts composition if
 * `value` is programmatically reset while the candidate window is open).
 * The committed term is only updated after a debounce delay, or
 * immediately once an IME composition ends.
 */
export const useDebouncedSearchInput = ({
  searchTerm,
  onCommit,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseDebouncedSearchInputOptions): UseDebouncedSearchInputReturn => {
  const [inputValue, setInputValue] = useState(searchTerm);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when searchTerm changes from outside this hook
  // (e.g. the clear button, or restoring a persisted search term on mount).
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const scheduleSearch = (term: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onCommit(term);
    }, debounceMs);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setInputValue(term);

    // While an IME composition is in progress, the value is not final yet
    // (e.g. raw Zhuyin/Pinyin keys) — don't search or touch searchTerm.
    if (isComposingRef.current) {
      return;
    }

    scheduleSearch(term);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (
    event: React.CompositionEvent<HTMLInputElement>,
  ) => {
    isComposingRef.current = false;
    const term = event.currentTarget.value;
    setInputValue(term);
    scheduleSearch(term);
  };

  const clearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setInputValue('');
    onCommit('');
  };

  return {
    inputValue,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    clearSearch,
  };
};

import { useState, useCallback } from 'react';

interface UseQuickFiltersReturn {
  activeFilters: string[];
  toggleFilter: (key: string) => void;
  /** Stable string representation of activeFilters, handy as an effect dependency. */
  filtersKey: string;
}

/**
 * Tracks a set of toggleable quick-filter keys, persisted to sessionStorage
 * so the selection survives navigation within the same browser session.
 */
export const useQuickFilters = (sessionKey: string): UseQuickFiltersReturn => {
  const [activeFilters, setActiveFilters] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem(sessionKey);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const toggleFilter = useCallback(
    (key: string) => {
      setActiveFilters(prev => {
        const next = prev.includes(key)
          ? prev.filter(k => k !== key)
          : [...prev, key];
        if (next.length > 0) {
          sessionStorage.setItem(sessionKey, JSON.stringify(next));
        } else {
          sessionStorage.removeItem(sessionKey);
        }
        return next;
      });
    },
    [sessionKey],
  );

  return {
    activeFilters,
    toggleFilter,
    filtersKey: activeFilters.join(','),
  };
};

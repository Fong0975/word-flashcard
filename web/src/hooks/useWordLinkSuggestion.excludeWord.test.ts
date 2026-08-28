import { renderHook, act, waitFor } from '@testing-library/react';

import { apiService } from '../lib/api';
import { Word } from '../types/api';
import { FamiliarityLevel } from '../types/base';

import { useWordLinkSuggestion } from './useWordLinkSuggestion';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('useWordLinkSuggestion excludeWord', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('typing flow (notifyChange)', () => {
    it('does not schedule a lookup for a candidate matching excludeWord (case-insensitive)', async () => {
      const searchWordsSpy = vi
        .spyOn(apiService, 'searchWords')
        .mockResolvedValue([buildWord({ word: 'apple' })]);
      const { result } = renderHook(() => useWordLinkSuggestion('Apple'));

      act(() => {
        result.current.notifyChange('`apple`', 7);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(searchWordsSpy).not.toHaveBeenCalled();
      expect(result.current.suggestion).toBeNull();
    });

    it('still schedules a lookup for a different word when excludeWord is set', async () => {
      vi.spyOn(apiService, 'searchWords').mockResolvedValue([
        buildWord({ word: 'banana' }),
      ]);
      const { result } = renderHook(() => useWordLinkSuggestion('apple'));

      act(() => {
        result.current.notifyChange('`banana`', 8);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await waitFor(() =>
        expect(result.current.suggestion).toEqual({
          word: 'banana',
          insertPosition: 8,
        }),
      );
    });
  });

  describe('blur flow (notifyBlur)', () => {
    it('excludes the excludeWord candidate from the full-text scan', async () => {
      const searchWordsSpy = vi
        .spyOn(apiService, 'searchWords')
        .mockResolvedValue([buildWord({ word: 'apple' })]);
      const { result } = renderHook(() => useWordLinkSuggestion('apple'));

      await act(async () => {
        result.current.notifyBlur('`apple`');
        await Promise.resolve();
      });

      expect(searchWordsSpy).not.toHaveBeenCalled();
      expect(result.current.suggestion).toBeNull();
      expect(result.current.queueProgress).toBeNull();
    });

    it('still surfaces a different candidate, numbering the total correctly, when excludeWord is set', async () => {
      vi.spyOn(apiService, 'searchWords').mockImplementation(
        async (params = {}) => {
          const queriedWord = params.searchFilter?.conditions[0]?.value;
          return queriedWord === 'banana'
            ? [buildWord({ word: 'banana' })]
            : [];
        },
      );
      const { result } = renderHook(() => useWordLinkSuggestion('apple'));

      await act(async () => {
        result.current.notifyBlur('`apple` `banana`');
        await Promise.resolve();
      });

      await waitFor(() =>
        expect(result.current.suggestion).toEqual({
          word: 'banana',
          insertPosition: 16,
        }),
      );
      // "apple" is excluded outright, so it's never counted in the total.
      expect(result.current.queueProgress).toEqual({ current: 1, total: 1 });
    });
  });
});

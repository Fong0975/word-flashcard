import { renderHook, act, waitFor } from '@testing-library/react';

import { apiService } from '../lib/api';
import { Word } from '../types/api';
import { FamiliarityLevel } from '../types/base';
import { createExactWordSearchFilter } from '../utils/searchFilters';

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

describe('useWordLinkSuggestion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not schedule a lookup when no backtick pair has just completed', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('abc', 3);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchWordsSpy).not.toHaveBeenCalled();
  });

  it('does not schedule a lookup when the candidate is already followed by a link', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`([link](/word/apple))', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchWordsSpy).not.toHaveBeenCalled();
  });

  it('does not schedule a lookup for a word already dismissed', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ word: 'apple' })]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await waitFor(() => expect(result.current.suggestion).not.toBeNull());

    act(() => {
      result.current.dismissSuggestion('`apple`');
    });
    searchWordsSpy.mockClear();

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchWordsSpy).not.toHaveBeenCalled();
  });

  it('calls apiService.searchWords with createExactWordSearchFilter(word) after the debounce delay', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    expect(searchWordsSpy).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchWordsSpy).toHaveBeenCalledWith({
      searchFilter: createExactWordSearchFilter('apple'),
    });
  });

  it('sets suggestion when the search returns a case-insensitive match', async () => {
    vi.spyOn(apiService, 'searchWords').mockResolvedValue([
      buildWord({ word: 'Apple' }),
    ]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'apple',
        insertPosition: 7,
      }),
    );
  });

  it('leaves suggestion null when the search returns no match', async () => {
    vi.spyOn(apiService, 'searchWords').mockResolvedValue([]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.suggestion).toBeNull();
  });

  it('discards a stale response when a newer candidate has since been detected', async () => {
    let resolveFirst: (value: Word[]) => void = () => {};
    const firstLookup = new Promise<Word[]>(resolve => {
      resolveFirst = resolve;
    });
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockReturnValueOnce(firstLookup);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`cat`', 5);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchWordsSpy).toHaveBeenCalledTimes(1);

    searchWordsSpy.mockResolvedValueOnce([buildWord({ word: 'dog' })]);
    act(() => {
      result.current.notifyChange('`dog`', 5);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'dog',
        insertPosition: 5,
      }),
    );

    await act(async () => {
      resolveFirst([buildWord({ word: 'cat' })]);
      await Promise.resolve();
    });

    expect(result.current.suggestion).toEqual({
      word: 'dog',
      insertPosition: 5,
    });
  });

  it('clears a previously shown suggestion as soon as notifyChange is called again', async () => {
    vi.spyOn(apiService, 'searchWords').mockResolvedValue([
      buildWord({ word: 'apple' }),
    ]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await waitFor(() => expect(result.current.suggestion).not.toBeNull());

    act(() => {
      result.current.notifyChange('`apple` x', 9);
    });

    expect(result.current.suggestion).toBeNull();
  });

  it('dismissSuggestion clears the suggestion and marks the word as dismissed', async () => {
    vi.spyOn(apiService, 'searchWords').mockResolvedValue([
      buildWord({ word: 'apple' }),
    ]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'apple',
        insertPosition: 7,
      }),
    );

    act(() => {
      result.current.dismissSuggestion('`apple`');
    });

    expect(result.current.suggestion).toBeNull();
  });

  it('silently ignores a rejected apiService.searchWords call', async () => {
    vi.spyOn(apiService, 'searchWords').mockRejectedValue(
      new Error('network down'),
    );
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.suggestion).toBeNull();
  });

  it('cancels the pending lookup on unmount', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    const { result, unmount } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyChange('`apple`', 7);
    });
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchWordsSpy).not.toHaveBeenCalled();
  });
});

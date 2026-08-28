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

describe('useWordLinkSuggestion notifyBlur', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not schedule any lookup when the text has no backtick pairs', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    await act(async () => {
      result.current.notifyBlur('no backticks here');
      await Promise.resolve();
    });

    expect(searchWordsSpy).not.toHaveBeenCalled();
    expect(result.current.suggestion).toBeNull();
    expect(result.current.queueProgress).toBeNull();
  });

  it('skips a candidate that already has a link after it or was previously dismissed', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ word: 'apple' })]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    // Dismiss "apple" via the typing flow first.
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

    await act(async () => {
      result.current.notifyBlur('`apple` and `banana`([link](/word/banana))');
      await Promise.resolve();
    });

    expect(searchWordsSpy).not.toHaveBeenCalled();
    expect(result.current.suggestion).toBeNull();
    expect(result.current.queueProgress).toBeNull();
  });

  it('sets the suggestion for a missed candidate that is a known word, with queue progress', async () => {
    vi.spyOn(apiService, 'searchWords').mockImplementation(
      async (params = {}) => {
        const queriedWord = params.searchFilter?.conditions[0]?.value;
        return queriedWord === 'apple' ? [buildWord({ word: 'apple' })] : [];
      },
    );
    const { result } = renderHook(() => useWordLinkSuggestion());

    await act(async () => {
      result.current.notifyBlur('`apple` `banana`');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'apple',
        insertPosition: 7,
      }),
    );
    // "banana" isn't a known word, so it's never counted as a suggestion —
    // the total only ever reflects candidates confirmed to be known words.
    expect(result.current.queueProgress).toEqual({ current: 1, total: 1 });
  });

  it('excludes an unknown candidate from the count and exhausts the queue after the single known one', async () => {
    const searchWordsSpy = vi.spyOn(apiService, 'searchWords');
    searchWordsSpy.mockResolvedValueOnce([]); // apple: not a saved word
    searchWordsSpy.mockResolvedValueOnce([buildWord({ word: 'banana' })]); // banana: saved
    const { result } = renderHook(() => useWordLinkSuggestion());

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
    // "apple" wasn't a known word, so it's excluded entirely rather than
    // counted — "banana" is the only (and therefore first-of-one) suggestion.
    expect(result.current.queueProgress).toEqual({ current: 1, total: 1 });

    await act(async () => {
      result.current.dismissSuggestion('`apple` `banana`');
      await Promise.resolve();
    });

    expect(result.current.suggestion).toBeNull();
    expect(result.current.queueProgress).toBeNull();
  });

  it('numbers a cascade by known-word count, skipping an unknown candidate in the middle', async () => {
    vi.spyOn(apiService, 'searchWords').mockImplementation(
      async (params = {}) => {
        const queriedWord = params.searchFilter?.conditions[0]?.value;
        // "banana" (the middle candidate) is the only one that isn't saved.
        return queriedWord === 'banana'
          ? []
          : [buildWord({ word: queriedWord ?? '' })];
      },
    );
    const { result } = renderHook(() => useWordLinkSuggestion());

    await act(async () => {
      result.current.notifyBlur('`apple` `banana` `cherry`');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'apple',
        insertPosition: 7,
      }),
    );
    // Only "apple" and "cherry" are known words, so the total is 2 — not 3,
    // the number of backtick pairs actually found in the text.
    expect(result.current.queueProgress).toEqual({ current: 1, total: 2 });

    await act(async () => {
      result.current.dismissSuggestion('`apple` `banana` `cherry`');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'cherry',
        insertPosition: 25,
      }),
    );
    expect(result.current.queueProgress).toEqual({ current: 2, total: 2 });
  });

  it('dedupes case-insensitive repeats of the same word into a single candidate', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ word: 'apple' })]);
    const { result } = renderHook(() => useWordLinkSuggestion());

    await act(async () => {
      result.current.notifyBlur('`apple` and `Apple` again');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'apple',
        insertPosition: 7,
      }),
    );
    expect(searchWordsSpy).toHaveBeenCalledTimes(1);
    expect(result.current.queueProgress).toEqual({ current: 1, total: 1 });
  });

  it('advances to the next known candidate when the current one is skipped', async () => {
    vi.spyOn(apiService, 'searchWords').mockImplementation(
      async (params = {}) => {
        const queriedWord = params.searchFilter?.conditions[0]?.value;
        return [buildWord({ word: queriedWord ?? '' })];
      },
    );
    const { result } = renderHook(() => useWordLinkSuggestion());

    await act(async () => {
      result.current.notifyBlur('`apple` `banana`');
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'apple',
        insertPosition: 7,
      }),
    );
    expect(result.current.queueProgress).toEqual({ current: 1, total: 2 });

    await act(async () => {
      result.current.dismissSuggestion('`apple` `banana`');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'banana',
        insertPosition: 16,
      }),
    );
    expect(result.current.queueProgress).toEqual({ current: 2, total: 2 });
  });

  it("recomputes a later candidate's insert position against the current value after an earlier one shifted the text", async () => {
    vi.spyOn(apiService, 'searchWords').mockImplementation(
      async (params = {}) => {
        const queriedWord = params.searchFilter?.conditions[0]?.value;
        return [buildWord({ word: queriedWord ?? '' })];
      },
    );
    const { result } = renderHook(() => useWordLinkSuggestion());

    await act(async () => {
      result.current.notifyBlur('`apple` `banana`');
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'apple',
        insertPosition: 7,
      }),
    );

    // Simulates the caller having inserted a link at "apple"'s position,
    // which shifts "banana"'s offset in the text before continuing.
    const grownValue = '`apple`([link](/word/apple)) `banana`';
    await act(async () => {
      result.current.dismissSuggestion(grownValue);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'banana',
        insertPosition: 37,
      }),
    );
  });

  it('skips a candidate whose lookup rejects and continues to the next one', async () => {
    const searchWordsSpy = vi.spyOn(apiService, 'searchWords');
    searchWordsSpy.mockRejectedValueOnce(new Error('network down'));
    searchWordsSpy.mockResolvedValueOnce([buildWord({ word: 'banana' })]);
    const { result } = renderHook(() => useWordLinkSuggestion());

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
    expect(searchWordsSpy).toHaveBeenCalledTimes(2);
  });

  it('supersedes an in-progress blur scan when notifyBlur is called again', async () => {
    let resolveFirst: (value: Word[]) => void = () => {};
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockReturnValueOnce(
        new Promise<Word[]>(resolve => {
          resolveFirst = resolve;
        }),
      );
    const { result } = renderHook(() => useWordLinkSuggestion());

    await act(async () => {
      result.current.notifyBlur('`apple`');
      await Promise.resolve();
    });
    expect(searchWordsSpy).toHaveBeenCalledTimes(1);

    searchWordsSpy.mockResolvedValueOnce([buildWord({ word: 'banana' })]);
    await act(async () => {
      result.current.notifyBlur('`banana`');
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(result.current.suggestion).toEqual({
        word: 'banana',
        insertPosition: 8,
      }),
    );

    await act(async () => {
      resolveFirst([buildWord({ word: 'apple' })]);
      await Promise.resolve();
    });

    expect(result.current.suggestion).toEqual({
      word: 'banana',
      insertPosition: 8,
    });
  });

  it('does not set a suggestion if notifyChange is called before the lookup resolves', async () => {
    let resolveLookup: (value: Word[]) => void = () => {};
    vi.spyOn(apiService, 'searchWords').mockReturnValue(
      new Promise<Word[]>(resolve => {
        resolveLookup = resolve;
      }),
    );
    const { result } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyBlur('`apple`');
    });

    act(() => {
      result.current.notifyChange('`apple` x', 9);
    });

    await act(async () => {
      resolveLookup([buildWord({ word: 'apple' })]);
      await Promise.resolve();
    });

    expect(result.current.suggestion).toBeNull();
    expect(result.current.queueProgress).toBeNull();
  });

  it('aborts queue processing on unmount', async () => {
    const searchWordsSpy = vi
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ word: 'apple' })]);
    const { result, unmount } = renderHook(() => useWordLinkSuggestion());

    act(() => {
      result.current.notifyBlur('`apple` `banana`');
    });
    unmount();

    await act(async () => {
      await Promise.resolve();
    });
    expect(searchWordsSpy).toHaveBeenCalledTimes(1);
  });
});

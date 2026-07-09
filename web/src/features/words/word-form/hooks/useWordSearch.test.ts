import { renderHook, act, waitFor } from '@testing-library/react';

import { Word } from '../../../../types/api';
import {
  FamiliarityLevel,
  SearchOperation,
  SearchLogic,
} from '../../../../types/base';
import { apiService } from '../../../../lib/api';
import { MAX_SUGGESTIONS } from '../utils/constants';

import { useWordSearch } from './useWordSearch';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('useWordSearch', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('resets the search state immediately for a blank value', () => {
    const { result } = renderHook(() => useWordSearch({ mode: 'create' }));

    act(() => {
      result.current.handleWordChange('   ');
    });

    expect(result.current.searchState).toEqual({
      suggestions: [],
      isLoading: false,
      showSuggestions: false,
    });
  });

  it('searches for the word after the debounce delay', async () => {
    const searchWordsSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    const { result } = renderHook(() => useWordSearch({ mode: 'create' }));

    act(() => {
      result.current.handleWordChange('cat');
    });
    expect(searchWordsSpy).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(searchWordsSpy).toHaveBeenCalledWith({
      searchFilter: {
        conditions: [
          { key: 'word', operator: SearchOperation.LIKE, value: '%cat%' },
        ],
        logic: SearchLogic.OR,
      },
      limit: MAX_SUGGESTIONS,
    });
  });

  it('filters out an exact match and shows the remaining suggestions', async () => {
    const exactMatch = buildWord({ id: 1, word: 'cat' });
    const suggestion = buildWord({ id: 2, word: 'catalog' });
    jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([exactMatch, suggestion]);
    const { result } = renderHook(() => useWordSearch({ mode: 'create' }));

    act(() => {
      result.current.handleWordChange('cat');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() =>
      expect(result.current.searchState.suggestions).toEqual([suggestion]),
    );
    expect(result.current.searchState.showSuggestions).toBe(true);
    expect(result.current.searchState.isLoading).toBe(false);
  });

  it('hides suggestions once every result is filtered out', async () => {
    const exactMatch = buildWord({ id: 1, word: 'cat' });
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([exactMatch]);
    const { result } = renderHook(() => useWordSearch({ mode: 'create' }));

    act(() => {
      result.current.handleWordChange('cat');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() =>
      expect(result.current.searchState.showSuggestions).toBe(false),
    );
    expect(result.current.searchState.suggestions).toEqual([]);
  });

  it('reports a formatted error and resets state when the search fails', async () => {
    jest
      .spyOn(apiService, 'searchWords')
      .mockRejectedValue(new Error('network down'));
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useWordSearch({ mode: 'create', onError }),
    );

    act(() => {
      result.current.handleWordChange('cat');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        'Failed to search similar words: network down',
      ),
    );
    expect(result.current.searchState).toEqual({
      suggestions: [],
      isLoading: false,
      showSuggestions: false,
    });
  });

  it('resetSearch clears the search state', async () => {
    const suggestion = buildWord({ id: 2, word: 'catalog' });
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([suggestion]);
    const { result } = renderHook(() => useWordSearch({ mode: 'create' }));

    act(() => {
      result.current.handleWordChange('cat');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() =>
      expect(result.current.searchState.suggestions).toHaveLength(1),
    );

    act(() => {
      result.current.resetSearch();
    });

    expect(result.current.searchState).toEqual({
      suggestions: [],
      isLoading: false,
      showSuggestions: false,
    });
  });

  it('cancels the pending search on unmount', () => {
    const searchWordsSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    const { result, unmount } = renderHook(() =>
      useWordSearch({ mode: 'create' }),
    );

    act(() => {
      result.current.handleWordChange('cat');
    });
    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(searchWordsSpy).not.toHaveBeenCalled();
  });
});

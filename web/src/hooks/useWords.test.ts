import { renderHook, waitFor, act } from '@testing-library/react';

import { SearchOperation, SearchLogic, FamiliarityLevel } from '../types/base';
import { apiService } from '../lib/api';

import { useWords } from './useWords';

const lastCallArg = (mockFn: jest.Mock) =>
  mockFn.mock.calls[mockFn.mock.calls.length - 1][0];

describe('useWords', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([]);
    jest.spyOn(apiService, 'getWordsCount').mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('fetches without a search filter when there is no search term or extra conditions', async () => {
    const { result } = renderHook(() => useWords());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiService.searchWords).toHaveBeenCalledWith({
      limit: 50,
      offset: 0,
      sort: undefined,
    });
  });

  it('searches across word, definition, and notes with OR logic for a plain keyword', async () => {
    const { result } = renderHook(() => useWords());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('cat');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const params = lastCallArg(apiService.searchWords as jest.Mock);
    expect(params.searchFilter).toEqual({
      conditions: [
        { key: 'word', operator: SearchOperation.LIKE, value: '%cat%' },
        { key: 'definition', operator: SearchOperation.LIKE, value: '%cat%' },
        { key: 'notes', operator: SearchOperation.LIKE, value: '%cat%' },
      ],
      logic: SearchLogic.OR,
    });
  });

  it('combines extra conditions with AND logic when there is no keyword', async () => {
    const extraConditions = [
      { key: 'familiarity', operator: SearchOperation.EQUALS, value: 'red' },
    ];
    const { result } = renderHook(() => useWords({ extraConditions }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const params = lastCallArg(apiService.searchWords as jest.Mock);
    expect(params.searchFilter).toEqual({
      conditions: extraConditions,
      logic: SearchLogic.AND,
    });
  });

  it('scopes the keyword to the word field only when extra conditions are present', async () => {
    const extraConditions = [
      { key: 'familiarity', operator: SearchOperation.EQUALS, value: 'red' },
    ];
    const { result } = renderHook(() => useWords({ extraConditions }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('cat');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const params = lastCallArg(apiService.searchWords as jest.Mock);
    expect(params.searchFilter).toEqual({
      conditions: [
        { key: 'word', operator: SearchOperation.LIKE, value: '%cat%' },
        ...extraConditions,
      ],
      logic: SearchLogic.AND,
    });
  });

  it('passes the sort option through to the API', async () => {
    renderHook(() => useWords({ sort: 'word_asc' }));

    await waitFor(() =>
      expect(apiService.searchWords).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'word_asc' }),
      ),
    );
  });

  it('mirrors entities/fetchEntities as words/fetchWords', async () => {
    const word = {
      id: 1,
      word: 'apple',
      familiarity: FamiliarityLevel.GREEN,
      reminder: null,
      count_practise: 0,
      definitions: [],
    };
    (apiService.searchWords as jest.Mock).mockResolvedValue([word]);
    (apiService.getWordsCount as jest.Mock).mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useWords());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.words).toEqual([word]);
    expect(result.current.entities).toEqual([word]);
    expect(result.current.fetchWords).toBe(result.current.fetchEntities);
  });
});

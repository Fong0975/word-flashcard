import { renderHook, waitFor, act } from '@testing-library/react';

import { apiService } from '../lib/api';
import { SearchOperation, SearchLogic } from '../types/base';

import { useNotes } from './useNotes';

const lastCallArg = (mockFn: jest.Mock) =>
  mockFn.mock.calls[mockFn.mock.calls.length - 1][0];

describe('useNotes', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(apiService, 'searchNotes').mockResolvedValue([]);
    jest.spyOn(apiService, 'getNotesCount').mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('fetches with no search filter when there is no search term', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiService.searchNotes).toHaveBeenCalledWith({
      limit: 30,
      offset: 0,
      searchFilter: undefined,
    });
  });

  it('treats a whitespace-only search term as no filter', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('   ');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const params = lastCallArg(apiService.searchNotes as jest.Mock);
    expect(params.searchFilter).toBeUndefined();
  });

  it('searches title and content with OR logic for a keyword', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('cat');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const params = lastCallArg(apiService.searchNotes as jest.Mock);
    expect(params.searchFilter).toEqual({
      conditions: [
        { key: 'title', operator: SearchOperation.LIKE, value: '%cat%' },
        { key: 'content', operator: SearchOperation.LIKE, value: '%cat%' },
      ],
      logic: SearchLogic.OR,
    });
  });

  it('mirrors entities/fetchEntities as notes/fetchNotes', async () => {
    const note = {
      id: 1,
      title: 'Groceries',
      content: 'Milk',
      sort_order: 0,
      updated_at: null,
    };
    (apiService.searchNotes as jest.Mock).mockResolvedValue([note]);
    (apiService.getNotesCount as jest.Mock).mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notes).toEqual([note]);
    expect(result.current.entities).toEqual([note]);
    expect(result.current.fetchNotes).toBe(result.current.fetchEntities);
  });
});

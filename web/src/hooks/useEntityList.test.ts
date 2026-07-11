import { renderHook, waitFor, act } from '@testing-library/react';

import { BaseEntity, SearchLogic } from '../types/base';

import { useEntityList, ApiServiceConfig, SearchConfig } from './useEntityList';

interface TestEntity extends BaseEntity {
  name: string;
}

const buildEntity = (id: number, name: string): TestEntity => ({ id, name });

const buildApiService = (
  entities: TestEntity[],
  totalCount = entities.length,
): ApiServiceConfig<TestEntity> => ({
  fetchList: jest.fn().mockResolvedValue(entities),
  getCount: jest.fn().mockResolvedValue({ count: totalCount }),
});

const clientSearchConfig: SearchConfig<TestEntity> = {
  type: 'client',
  filterPredicate: (entity, term) => entity.name.includes(term),
};

describe('useEntityList', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('auto-fetches entities on mount with default pagination', async () => {
    const entities = [buildEntity(1, 'apple'), buildEntity(2, 'banana')];
    const apiService = buildApiService(entities, 2);

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService,
        searchConfig: clientSearchConfig,
        itemsPerPage: 10,
      }),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entities).toEqual(entities);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasNext).toBe(false);
    expect(result.current.hasPrevious).toBe(false);
    expect(apiService.fetchList).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('does not auto-fetch when autoFetch is false', () => {
    const apiService = buildApiService([]);

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService,
        searchConfig: clientSearchConfig,
        autoFetch: false,
      }),
    );

    expect(result.current.loading).toBe(false);
    expect(apiService.fetchList).not.toHaveBeenCalled();
  });

  it('normalizes a non-array response into an empty entity list', async () => {
    const apiService: ApiServiceConfig<TestEntity> = {
      fetchList: jest.fn().mockResolvedValue(null as unknown as TestEntity[]),
      getCount: jest.fn().mockResolvedValue({ count: 0 }),
    };

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService,
        searchConfig: clientSearchConfig,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entities).toEqual([]);
  });

  it('records a fetch failure in error state instead of throwing', async () => {
    const apiService: ApiServiceConfig<TestEntity> = {
      fetchList: jest.fn().mockRejectedValue(new Error('boom')),
      getCount: jest.fn().mockResolvedValue({ count: 0 }),
    };

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService,
        searchConfig: clientSearchConfig,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
    expect(result.current.entities).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('fetches the next page when one is available', async () => {
    const page1 = [buildEntity(1, 'a')];
    const page2 = [buildEntity(2, 'b')];
    const fetchList = jest
      .fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);
    const getCount = jest.fn().mockResolvedValue({ count: 2 });

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService: { fetchList, getCount },
        searchConfig: clientSearchConfig,
        itemsPerPage: 1,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasNext).toBe(true);

    await act(async () => {
      await result.current.nextPage();
    });

    expect(fetchList).toHaveBeenLastCalledWith({ limit: 1, offset: 1 });
    expect(result.current.entities).toEqual(page2);
    expect(result.current.currentPage).toBe(2);
  });

  it('does not fetch past the last page', async () => {
    const apiService = buildApiService([buildEntity(1, 'a')], 1);

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService,
        searchConfig: clientSearchConfig,
        itemsPerPage: 1,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasNext).toBe(false);

    await act(async () => {
      await result.current.nextPage();
    });

    expect(apiService.fetchList).toHaveBeenCalledTimes(1);
  });

  it('ignores goToPage calls outside the valid page range', async () => {
    const apiService = buildApiService([buildEntity(1, 'a')], 1);

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService,
        searchConfig: clientSearchConfig,
        itemsPerPage: 1,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.goToPage(0);
      await result.current.goToPage(99);
    });

    expect(apiService.fetchList).toHaveBeenCalledTimes(1);
  });

  it('resets to page 1 and re-fetches when the search term changes', async () => {
    const entities = [buildEntity(1, 'apple'), buildEntity(2, 'banana')];
    const fetchList = jest.fn().mockResolvedValue(entities);
    const getCount = jest.fn().mockResolvedValue({ count: 2 });

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService: { fetchList, getCount },
        searchConfig: clientSearchConfig,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('app');
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.entities).toEqual([entities[0]]);
    expect(fetchList).toHaveBeenCalledTimes(2);
  });

  it('sends a server-side search filter built by createSearchFilter', async () => {
    const entities = [buildEntity(1, 'apple')];
    const fetchList = jest.fn().mockResolvedValue(entities);
    const getCount = jest.fn().mockResolvedValue({ count: 1 });
    const searchFilter = { conditions: [], logic: SearchLogic.OR };

    const serverSearchConfig: SearchConfig<TestEntity> = {
      type: 'server',
      createSearchFilter: () => searchFilter,
    };

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService: { fetchList, getCount },
        searchConfig: serverSearchConfig,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('app');
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchList).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchFilter }),
    );
    expect(getCount).toHaveBeenLastCalledWith(searchFilter);
  });

  it('rejects with the error message when refresh fails, unlike a plain fetch', async () => {
    const fetchList = jest
      .fn()
      .mockResolvedValueOnce([buildEntity(1, 'a')])
      .mockRejectedValueOnce(new Error('refresh failed'));
    const getCount = jest.fn().mockResolvedValue({ count: 1 });

    const { result } = renderHook(() =>
      useEntityList<TestEntity>({
        entityName: 'items',
        apiService: { fetchList, getCount },
        searchConfig: clientSearchConfig,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.refresh()).rejects.toThrow('refresh failed');
    });
  });
});

import { FC, ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { EntityListHook, BaseEntity } from '../../../types';

import { useUrlSyncedEntityList } from './useUrlSyncedEntityList';

interface TestEntity extends BaseEntity {
  name: string;
}

const buildEntityListHook = (
  overrides: Partial<EntityListHook<TestEntity>> = {},
): EntityListHook<TestEntity> => ({
  entities: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 5,
  hasNext: true,
  hasPrevious: false,
  itemsPerPage: 10,
  searchTerm: '',
  totalCount: 50,
  fetchEntities: jest.fn().mockResolvedValue(undefined),
  nextPage: jest.fn().mockResolvedValue(undefined),
  previousPage: jest.fn().mockResolvedValue(undefined),
  goToPage: jest.fn().mockResolvedValue(undefined),
  goToFirst: jest.fn().mockResolvedValue(undefined),
  goToLast: jest.fn().mockResolvedValue(undefined),
  refresh: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
  setSearchTerm: jest.fn(),
  ...overrides,
});

const buildWrapper = (
  initialEntries: string[],
): FC<{ children: ReactNode }> => {
  return ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
};

describe('useUrlSyncedEntityList', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('reads sort from the URL', () => {
    const entityListHook = buildEntityListHook({ currentPage: 3 });
    const { result } = renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/?page=3&sort=word_asc']) },
    );

    expect(result.current.urlSort).toBe('word_asc');
  });

  it('defaults to no sort when absent', () => {
    const entityListHook = buildEntityListHook();
    const { result } = renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/']) },
    );

    expect(result.current.urlSort).toBe('');
  });

  it('fetches the URL page on mount when it differs from the hook state', async () => {
    const entityListHook = buildEntityListHook({ currentPage: 1 });
    renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/?page=3']) },
    );

    await waitFor(() =>
      expect(entityListHook.fetchEntities).toHaveBeenCalledWith(3),
    );
  });

  it('does not re-fetch on mount when the URL page matches the hook state', () => {
    const entityListHook = buildEntityListHook({ currentPage: 1 });
    renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/']) },
    );

    expect(entityListHook.fetchEntities).not.toHaveBeenCalled();
  });

  it('goToPage updates the URL and fetches the target page', async () => {
    const entityListHook = buildEntityListHook({ currentPage: 1 });
    const { result } = renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/']) },
    );

    await act(async () => {
      await result.current.patchedHook.goToPage(3);
    });

    await waitFor(() =>
      expect(entityListHook.fetchEntities).toHaveBeenCalledWith(3),
    );
  });

  it('nextPage is a no-op when the underlying hook has no next page', async () => {
    const entityListHook = buildEntityListHook({
      hasNext: false,
      currentPage: 1,
    });
    const { result } = renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/']) },
    );

    await act(async () => {
      await result.current.patchedHook.nextPage();
    });

    expect(entityListHook.fetchEntities).not.toHaveBeenCalled();
  });

  it('handleSortChange resets to page 1 and refetches', async () => {
    const entityListHook = buildEntityListHook({ currentPage: 3 });
    const { result } = renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/?page=3']) },
    );

    act(() => {
      result.current.handleSortChange('word_asc');
    });

    await waitFor(() => expect(result.current.urlSort).toBe('word_asc'));
    await waitFor(() =>
      expect(entityListHook.fetchEntities).toHaveBeenCalledWith(1),
    );
  });

  it('setSearchTerm persists to sessionStorage and delegates to the underlying hook', () => {
    const entityListHook = buildEntityListHook();
    const { result } = renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'search-key',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/']) },
    );

    act(() => {
      result.current.patchedHook.setSearchTerm('cat');
    });

    expect(sessionStorage.getItem('search-key')).toBe('cat');
    expect(entityListHook.setSearchTerm).toHaveBeenCalledWith('cat');
  });

  it('clearing the search term removes the sessionStorage entry', () => {
    sessionStorage.setItem('search-key', 'cat');
    const entityListHook = buildEntityListHook();
    const { result } = renderHook(
      () =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'search-key',
          filtersKey: '',
        }),
      { wrapper: buildWrapper(['/']) },
    );

    act(() => {
      result.current.patchedHook.setSearchTerm('');
    });

    expect(sessionStorage.getItem('search-key')).toBeNull();
  });

  it('resets to page 1 and refetches when filtersKey changes', async () => {
    const entityListHook = buildEntityListHook({ currentPage: 1 });
    const { rerender } = renderHook(
      ({ filtersKey }: { filtersKey: string }) =>
        useUrlSyncedEntityList({
          entityListHook,
          sessionSearchKey: 'k',
          filtersKey,
        }),
      { wrapper: buildWrapper(['/']), initialProps: { filtersKey: '' } },
    );
    (entityListHook.fetchEntities as jest.Mock).mockClear();

    rerender({ filtersKey: 'red' });

    await waitFor(() =>
      expect(entityListHook.fetchEntities).toHaveBeenCalledWith(1),
    );
  });
});

import { renderHook, act } from '@testing-library/react';

import { useQuickFilters } from './useQuickFilters';

describe('useQuickFilters', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useQuickFilters('test-key'));
    expect(result.current.activeFilters).toEqual([]);
    expect(result.current.filtersKey).toBe('');
  });

  it('restores previously stored filters', () => {
    sessionStorage.setItem('test-key', JSON.stringify(['red', 'green']));
    const { result } = renderHook(() => useQuickFilters('test-key'));
    expect(result.current.activeFilters).toEqual(['red', 'green']);
    expect(result.current.filtersKey).toBe('red,green');
  });

  it('falls back to an empty list when sessionStorage contains invalid JSON', () => {
    sessionStorage.setItem('test-key', '{not valid json');
    const { result } = renderHook(() => useQuickFilters('test-key'));
    expect(result.current.activeFilters).toEqual([]);
  });

  it('adds a filter and persists it', () => {
    const { result } = renderHook(() => useQuickFilters('test-key'));

    act(() => {
      result.current.toggleFilter('red');
    });

    expect(result.current.activeFilters).toEqual(['red']);
    expect(sessionStorage.getItem('test-key')).toBe(JSON.stringify(['red']));
  });

  it('removes an already-active filter', () => {
    const { result } = renderHook(() => useQuickFilters('test-key'));
    act(() => {
      result.current.toggleFilter('red');
    });
    act(() => {
      result.current.toggleFilter('green');
    });
    act(() => {
      result.current.toggleFilter('red');
    });

    expect(result.current.activeFilters).toEqual(['green']);
  });

  it('removes the sessionStorage entry once no filters remain active', () => {
    const { result } = renderHook(() => useQuickFilters('test-key'));
    act(() => {
      result.current.toggleFilter('red');
    });
    act(() => {
      result.current.toggleFilter('red');
    });

    expect(result.current.activeFilters).toEqual([]);
    expect(sessionStorage.getItem('test-key')).toBeNull();
  });
});

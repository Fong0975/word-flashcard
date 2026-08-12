import { ChangeEvent, CompositionEvent } from 'react';
import { renderHook, act } from '@testing-library/react';

import { useDebouncedSearchInput } from './useDebouncedSearchInput';

const buildChangeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const buildCompositionEvent = (value: string) =>
  ({ currentTarget: { value } }) as CompositionEvent<HTMLInputElement>;

describe('useDebouncedSearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes inputValue from searchTerm', () => {
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: 'apple', onCommit: vi.fn() }),
    );
    expect(result.current.inputValue).toBe('apple');
  });

  it('commits the value after the debounce delay', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleChange(buildChangeEvent('cat'));
    });
    expect(result.current.inputValue).toBe('cat');
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommit).toHaveBeenCalledWith('cat');
  });

  it('resets the debounce timer on rapid changes, keeping only the last value', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleChange(buildChangeEvent('c'));
      vi.advanceTimersByTime(200);
      result.current.handleChange(buildChangeEvent('ca'));
      vi.advanceTimersByTime(200);
      result.current.handleChange(buildChangeEvent('cat'));
      vi.advanceTimersByTime(300);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('cat');
  });

  it('does not schedule a commit while an IME composition is in progress', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleCompositionStart();
      result.current.handleChange(buildChangeEvent('composing'));
      vi.advanceTimersByTime(300);
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.inputValue).toBe('composing');
  });

  it('schedules a commit once the composition ends, updating the value right away', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleCompositionStart();
      result.current.handleCompositionEnd(buildCompositionEvent('cat'));
    });

    expect(result.current.inputValue).toBe('cat');
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommit).toHaveBeenCalledWith('cat');
  });

  it('clearSearch resets the input and commits an empty string immediately', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({
        searchTerm: 'cat',
        onCommit,
        debounceMs: 300,
      }),
    );

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.inputValue).toBe('');
    expect(onCommit).toHaveBeenCalledWith('');
  });

  it('syncs inputValue when searchTerm changes externally', () => {
    const { result, rerender } = renderHook(
      ({ searchTerm }: { searchTerm: string }) =>
        useDebouncedSearchInput({ searchTerm, onCommit: vi.fn() }),
      { initialProps: { searchTerm: 'apple' } },
    );
    expect(result.current.inputValue).toBe('apple');

    rerender({ searchTerm: 'banana' });
    expect(result.current.inputValue).toBe('banana');
  });

  it('cancels the pending commit on unmount', () => {
    const onCommit = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleChange(buildChangeEvent('cat'));
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onCommit).not.toHaveBeenCalled();
  });
});

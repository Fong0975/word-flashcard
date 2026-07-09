import { ChangeEvent, CompositionEvent } from 'react';
import { renderHook, act } from '@testing-library/react';

import { useDebouncedSearchInput } from './useDebouncedSearchInput';

const buildChangeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const buildCompositionEvent = (value: string) =>
  ({ currentTarget: { value } }) as CompositionEvent<HTMLInputElement>;

describe('useDebouncedSearchInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes inputValue from searchTerm', () => {
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: 'apple', onCommit: jest.fn() }),
    );
    expect(result.current.inputValue).toBe('apple');
  });

  it('commits the value after the debounce delay', () => {
    const onCommit = jest.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleChange(buildChangeEvent('cat'));
    });
    expect(result.current.inputValue).toBe('cat');
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(onCommit).toHaveBeenCalledWith('cat');
  });

  it('resets the debounce timer on rapid changes, keeping only the last value', () => {
    const onCommit = jest.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleChange(buildChangeEvent('c'));
      jest.advanceTimersByTime(200);
      result.current.handleChange(buildChangeEvent('ca'));
      jest.advanceTimersByTime(200);
      result.current.handleChange(buildChangeEvent('cat'));
      jest.advanceTimersByTime(300);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('cat');
  });

  it('does not schedule a commit while an IME composition is in progress', () => {
    const onCommit = jest.fn();
    const { result } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleCompositionStart();
      result.current.handleChange(buildChangeEvent('composing'));
      jest.advanceTimersByTime(300);
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.inputValue).toBe('composing');
  });

  it('schedules a commit once the composition ends, updating the value right away', () => {
    const onCommit = jest.fn();
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
      jest.advanceTimersByTime(300);
    });
    expect(onCommit).toHaveBeenCalledWith('cat');
  });

  it('clearSearch resets the input and commits an empty string immediately', () => {
    const onCommit = jest.fn();
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
        useDebouncedSearchInput({ searchTerm, onCommit: jest.fn() }),
      { initialProps: { searchTerm: 'apple' } },
    );
    expect(result.current.inputValue).toBe('apple');

    rerender({ searchTerm: 'banana' });
    expect(result.current.inputValue).toBe('banana');
  });

  it('cancels the pending commit on unmount', () => {
    const onCommit = jest.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedSearchInput({ searchTerm: '', onCommit, debounceMs: 300 }),
    );

    act(() => {
      result.current.handleChange(buildChangeEvent('cat'));
    });
    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(onCommit).not.toHaveBeenCalled();
  });
});

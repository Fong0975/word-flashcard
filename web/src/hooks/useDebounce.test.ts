import { renderHook, act } from '@testing-library/react';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes the callback only after the delay elapses', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('a');
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('a');
  });

  it('resets the timer on repeated calls, keeping only the last invocation', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('first');
      vi.advanceTimersByTime(200);
      result.current.debouncedCallback('second');
      vi.advanceTimersByTime(200);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });

  it('does not invoke the callback after cancel is called', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('a');
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it('cleanup cancels any pending invocation', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('a');
      result.current.cleanup();
      vi.advanceTimersByTime(300);
    });
    expect(callback).not.toHaveBeenCalled();
  });
});

import { renderHook, act } from '@testing-library/react';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes the callback only after the delay elapses', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('a');
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('a');
  });

  it('resets the timer on repeated calls, keeping only the last invocation', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('first');
      jest.advanceTimersByTime(200);
      result.current.debouncedCallback('second');
      jest.advanceTimersByTime(200);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });

  it('does not invoke the callback after cancel is called', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('a');
      result.current.cancel();
      jest.advanceTimersByTime(300);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it('cleanup cancels any pending invocation', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current.debouncedCallback('a');
      result.current.cleanup();
      jest.advanceTimersByTime(300);
    });
    expect(callback).not.toHaveBeenCalled();
  });
});

import { renderHook, act } from '@testing-library/react';

import { useSlowRequestNotice } from './useSlowRequestNotice';

describe('useSlowRequestNotice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tests: {
    name: string;
    isLoading: boolean;
    advanceMs: number;
    thresholdMs?: number;
    expectedCalls: number;
  }[] = [
    {
      name: 'does not fire before the threshold',
      isLoading: true,
      advanceMs: 4999,
      thresholdMs: 5000,
      expectedCalls: 0,
    },
    {
      name: 'fires once when the threshold elapses',
      isLoading: true,
      advanceMs: 5000,
      thresholdMs: 5000,
      expectedCalls: 1,
    },
    {
      name: 'fires only once even if loading continues well past the threshold',
      isLoading: true,
      advanceMs: 60000,
      thresholdMs: 5000,
      expectedCalls: 1,
    },
    {
      name: 'never fires while not loading',
      isLoading: false,
      advanceMs: 60000,
      thresholdMs: 5000,
      expectedCalls: 0,
    },
    {
      name: 'uses the default 5s threshold when none is given',
      isLoading: true,
      advanceMs: 5000,
      expectedCalls: 1,
    },
  ];

  tests.forEach(tt => {
    it(tt.name, () => {
      const onSlow = vi.fn();
      renderHook(() =>
        useSlowRequestNotice(tt.isLoading, onSlow, tt.thresholdMs),
      );

      act(() => {
        vi.advanceTimersByTime(tt.advanceMs);
      });

      expect(onSlow).toHaveBeenCalledTimes(tt.expectedCalls);
    });
  });

  it('cancels the timer when loading finishes before the threshold', () => {
    const onSlow = vi.fn();
    const { rerender } = renderHook(
      ({ isLoading }) => useSlowRequestNotice(isLoading, onSlow, 5000),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    rerender({ isLoading: false });
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onSlow).not.toHaveBeenCalled();
  });

  it('starts a fresh timer for each loading cycle', () => {
    const onSlow = vi.fn();
    const { rerender } = renderHook(
      ({ isLoading }) => useSlowRequestNotice(isLoading, onSlow, 5000),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    rerender({ isLoading: false });
    rerender({ isLoading: true });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSlow).toHaveBeenCalledTimes(2);
  });

  it('clears the timer on unmount', () => {
    const onSlow = vi.fn();
    const { unmount } = renderHook(() =>
      useSlowRequestNotice(true, onSlow, 5000),
    );

    unmount();
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onSlow).not.toHaveBeenCalled();
  });

  it('invokes the latest callback without restarting the timer', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ cb }) => useSlowRequestNotice(true, cb, 5000),
      { initialProps: { cb: first } },
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    rerender({ cb: second });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

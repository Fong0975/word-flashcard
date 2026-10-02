import { renderHook, act } from '@testing-library/react';

import {
  SLOW_LOOKUP_MESSAGE,
  SLOW_LOOKUP_TOAST_DURATION_MS,
  useSlowLookupToast,
} from './useSlowLookupToast';

describe('useSlowLookupToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tests: {
    name: string;
    loadingMs: number;
    finishLoading: boolean;
    expectedShows: number;
    expectedDismisses: number;
  }[] = [
    {
      name: 'shows nothing when the lookup settles before the threshold',
      loadingMs: 4999,
      finishLoading: true,
      expectedShows: 0,
      expectedDismisses: 0,
    },
    {
      name: 'shows the warning once the threshold passes and keeps it while loading',
      loadingMs: 5000,
      finishLoading: false,
      expectedShows: 1,
      expectedDismisses: 0,
    },
    {
      name: 'dismisses the warning when the lookup settles after it was shown',
      loadingMs: 12000,
      finishLoading: true,
      expectedShows: 1,
      expectedDismisses: 1,
    },
  ];

  tests.forEach(tt => {
    it(tt.name, () => {
      const show = vi.fn().mockReturnValue('toast-1');
      const dismiss = vi.fn();
      const { rerender } = renderHook(
        ({ isFetching }) => useSlowLookupToast(isFetching, { show, dismiss }),
        { initialProps: { isFetching: true } },
      );

      act(() => {
        vi.advanceTimersByTime(tt.loadingMs);
      });
      if (tt.finishLoading) {
        rerender({ isFetching: false });
      }

      expect(show).toHaveBeenCalledTimes(tt.expectedShows);
      expect(dismiss).toHaveBeenCalledTimes(tt.expectedDismisses);
      if (tt.expectedShows > 0) {
        expect(show).toHaveBeenCalledWith(
          SLOW_LOOKUP_MESSAGE,
          SLOW_LOOKUP_TOAST_DURATION_MS,
        );
      }
      if (tt.expectedDismisses > 0) {
        expect(dismiss).toHaveBeenCalledWith('toast-1');
      }
    });
  });

  it('does nothing when no toast controls are provided', () => {
    const { rerender } = renderHook(
      ({ isFetching }) => useSlowLookupToast(isFetching),
      { initialProps: { isFetching: true } },
    );

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      rerender({ isFetching: false });
    }).not.toThrow();
  });
});

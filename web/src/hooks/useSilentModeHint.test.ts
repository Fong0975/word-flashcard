import { renderHook, act } from '@testing-library/react';

import { useSilentModeHint } from './useSilentModeHint';

describe('useSilentModeHint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is hidden initially', () => {
    const { result } = renderHook(() => useSilentModeHint(true));
    expect(result.current.isVisible).toBe(false);
  });

  it('shows on focus and hides on blur', () => {
    const { result } = renderHook(() => useSilentModeHint(true));

    act(() => result.current.handlers.onFocus());
    expect(result.current.isVisible).toBe(true);

    act(() => result.current.handlers.onBlur());
    expect(result.current.isVisible).toBe(false);
  });

  it('shows after a click and hides once the duration elapses', () => {
    const { result } = renderHook(() => useSilentModeHint(true, 1000));

    act(() => result.current.handlers.onClick());
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isVisible).toBe(false);
  });

  it('restarts the timer when clicked again', () => {
    const { result } = renderHook(() => useSilentModeHint(true, 1000));

    act(() => result.current.handlers.onClick());
    act(() => {
      vi.advanceTimersByTime(800);
    });
    act(() => result.current.handlers.onClick());
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.isVisible).toBe(false);
  });

  it('stays visible while focused even after the click timer elapses', () => {
    const { result } = renderHook(() => useSilentModeHint(true, 1000));

    act(() => result.current.handlers.onFocus());
    act(() => result.current.handlers.onClick());
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('shows the hint for only the most recently activated instance', () => {
    const { result: first } = renderHook(() => useSilentModeHint(true, 1000));
    const { result: second } = renderHook(() => useSilentModeHint(true, 1000));

    act(() => first.current.handlers.onClick());
    expect(first.current.isVisible).toBe(true);
    expect(second.current.isVisible).toBe(false);

    act(() => second.current.handlers.onClick());
    expect(first.current.isVisible).toBe(false);
    expect(second.current.isVisible).toBe(true);
  });

  it('does not let an older instance timer hide the newer instance hint', () => {
    const { result: first } = renderHook(() => useSilentModeHint(true, 1000));
    const { result: second } = renderHook(() => useSilentModeHint(true, 1000));

    act(() => first.current.handlers.onClick());
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => second.current.handlers.onClick());
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(first.current.isVisible).toBe(false);
    expect(second.current.isVisible).toBe(true);
  });

  it('releases the hint when the owner unmounts', () => {
    const { result: first, unmount } = renderHook(() =>
      useSilentModeHint(true),
    );
    const { result: second } = renderHook(() => useSilentModeHint(true));

    act(() => first.current.handlers.onFocus());
    unmount();

    act(() => second.current.handlers.onFocus());
    expect(second.current.isVisible).toBe(true);
  });

  it('never shows when disabled', () => {
    const { result } = renderHook(() => useSilentModeHint(false));

    act(() => result.current.handlers.onFocus());
    act(() => result.current.handlers.onClick());

    expect(result.current.isVisible).toBe(false);
  });
});

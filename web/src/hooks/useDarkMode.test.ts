import { renderHook, act } from '@testing-library/react';

import { useDarkMode } from './useDarkMode';

type MediaQueryListener = (event: { matches: boolean }) => void;

const buildMatchMediaMock = (matches: boolean) => {
  const listeners: MediaQueryListener[] = [];
  const mql = {
    matches,
    addEventListener: jest.fn((_event: string, cb: MediaQueryListener) => {
      listeners.push(cb);
    }),
    removeEventListener: jest.fn((_event: string, cb: MediaQueryListener) => {
      const index = listeners.indexOf(cb);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }),
  };
  const dispatch = (newMatches: boolean) => {
    listeners.forEach(cb => cb({ matches: newMatches }));
  };
  return { mql, dispatch };
};

describe('useDarkMode', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    jest.restoreAllMocks();
  });

  it('uses the saved theme preference when present', () => {
    localStorage.setItem('theme', 'dark');
    const { mql } = buildMatchMediaMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('falls back to the system preference when no theme is saved', () => {
    const { mql } = buildMatchMediaMock(true);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.theme).toBe('dark');
  });

  it('falls back to light when the system prefers light and nothing is saved', () => {
    const { mql } = buildMatchMediaMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.theme).toBe('light');
    expect(result.current.isDarkMode).toBe(false);
  });

  it('toggleTheme flips the theme and persists it', () => {
    const { mql } = buildMatchMediaMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies a system theme change while no manual preference is stored', () => {
    const { mql, dispatch } = buildMatchMediaMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');

    act(() => {
      localStorage.removeItem('theme');
      dispatch(true);
    });

    expect(result.current.theme).toBe('dark');
  });

  it('ignores a system theme change once a manual preference is stored', () => {
    const { mql, dispatch } = buildMatchMediaMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useDarkMode());
    expect(localStorage.getItem('theme')).toBe('light');

    act(() => {
      dispatch(true);
    });

    expect(result.current.theme).toBe('light');
  });

  it('removes the system theme listener on unmount', () => {
    const { mql } = buildMatchMediaMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { unmount } = renderHook(() => useDarkMode());
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});

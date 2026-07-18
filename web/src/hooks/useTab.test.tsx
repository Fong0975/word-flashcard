import { FC, ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { useTab } from './useTab';

type RouterLocation = ReturnType<typeof useLocation>;

const buildWrapper = (
  initialEntries: string[],
): FC<{ children: ReactNode }> => {
  return ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
};

const buildWrapperWithLocation = (
  initialEntries: string[],
  locationRef: { current: RouterLocation | null },
): FC<{ children: ReactNode }> => {
  const LocationCapture = () => {
    locationRef.current = useLocation();
    return null;
  };

  return ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
      <LocationCapture />
    </MemoryRouter>
  );
};

describe('useTab', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults to the words tab when no ?tab param is present', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/']),
    });
    expect(result.current.currentTab).toBe('words');
  });

  it('reads a valid tab from the URL', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/?tab=questions']),
    });
    expect(result.current.currentTab).toBe('questions');
  });

  it('falls back to words for an invalid tab value', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/?tab=bogus']),
    });
    expect(result.current.currentTab).toBe('words');
  });

  it('switchTab updates the current tab', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/']),
    });

    act(() => {
      result.current.switchTab('notes');
    });

    expect(result.current.currentTab).toBe('notes');
  });

  it('switchTab dispatches a tabChange custom event', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/']),
    });
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');

    act(() => {
      result.current.switchTab('questions');
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const dispatchedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe('tabChange');
    expect(dispatchedEvent.detail).toEqual({
      tabName: 'questions',
      previousTab: 'words',
    });
  });

  it('switchTab removes the tab param when switching back to words', () => {
    const locationRef: { current: RouterLocation | null } = { current: null };
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapperWithLocation(['/?tab=notes'], locationRef),
    });

    act(() => {
      result.current.switchTab('words');
    });

    expect(result.current.currentTab).toBe('words');
    expect(locationRef.current?.search).toBe('');
  });

  it('switchTab is a no-op when switching to the already-active tab', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/?tab=notes']),
    });
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent');

    act(() => {
      result.current.switchTab('notes');
    });

    expect(result.current.currentTab).toBe('notes');
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['Digit1', 'words', '/?tab=notes'],
    ['Digit2', 'questions', '/'],
    ['Digit3', 'notes', '/'],
  ])(
    'responds to the Alt+%s keyboard shortcut by switching to %s',
    (code, expectedTab, initialEntry) => {
      const { result } = renderHook(() => useTab(), {
        wrapper: buildWrapper([initialEntry]),
      });

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent('keydown', { altKey: true, code }),
        );
      });

      expect(result.current.currentTab).toBe(expectedTab);
    },
  );

  it('ignores the keyboard shortcut without the Alt modifier', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/']),
    });

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2' }));
    });

    expect(result.current.currentTab).toBe('words');
  });
});

import { FC, ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { useTab } from './useTab';

const buildWrapper = (
  initialEntries: string[],
): FC<{ children: ReactNode }> => {
  return ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
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

  it('responds to the Alt+2 keyboard shortcut by switching to questions', () => {
    const { result } = renderHook(() => useTab(), {
      wrapper: buildWrapper(['/']),
    });

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { altKey: true, code: 'Digit2' }),
      );
    });

    expect(result.current.currentTab).toBe('questions');
  });

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

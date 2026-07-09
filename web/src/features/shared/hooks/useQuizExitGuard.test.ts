import { renderHook, act } from '@testing-library/react';

import { useQuizExitGuard } from './useQuizExitGuard';

describe('useQuizExitGuard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls onExit immediately when the back button handler fires while inactive', () => {
    const onExit = jest.fn();
    const { result } = renderHook(() =>
      useQuizExitGuard({ isActive: false, onExit }),
    );

    act(() => {
      result.current.handleBackButton();
    });

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(result.current.showExitConfirm).toBe(false);
  });

  it('shows the exit confirmation instead of exiting while active', () => {
    const onExit = jest.fn();
    const { result } = renderHook(() =>
      useQuizExitGuard({ isActive: true, onExit }),
    );

    act(() => {
      result.current.handleBackButton();
    });

    expect(onExit).not.toHaveBeenCalled();
    expect(result.current.showExitConfirm).toBe(true);
  });

  it('pushes a guard history entry while active', () => {
    const pushStateSpy = jest.spyOn(window.history, 'pushState');
    renderHook(() => useQuizExitGuard({ isActive: true, onExit: jest.fn() }));

    expect(pushStateSpy).toHaveBeenCalledWith(null, '');
  });

  it('does not push a guard history entry while inactive', () => {
    const pushStateSpy = jest.spyOn(window.history, 'pushState');
    renderHook(() => useQuizExitGuard({ isActive: false, onExit: jest.fn() }));

    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('shows the exit confirmation and re-guards history on popstate while active', () => {
    const pushStateSpy = jest.spyOn(window.history, 'pushState');
    const { result } = renderHook(() =>
      useQuizExitGuard({ isActive: true, onExit: jest.fn() }),
    );
    pushStateSpy.mockClear();

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.showExitConfirm).toBe(true);
    expect(pushStateSpy).toHaveBeenCalledWith(null, '');
  });

  it('exit confirm hides the dialog and calls onExit', () => {
    const onExit = jest.fn();
    const { result } = renderHook(() =>
      useQuizExitGuard({ isActive: true, onExit }),
    );
    act(() => {
      result.current.handleBackButton();
    });

    act(() => {
      result.current.handleExitConfirm();
    });

    expect(result.current.showExitConfirm).toBe(false);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('exit cancel hides the dialog without calling onExit', () => {
    const onExit = jest.fn();
    const { result } = renderHook(() =>
      useQuizExitGuard({ isActive: true, onExit }),
    );
    act(() => {
      result.current.handleBackButton();
    });

    act(() => {
      result.current.handleExitCancel();
    });

    expect(result.current.showExitConfirm).toBe(false);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('prevents the default beforeunload behavior while active', () => {
    renderHook(() => useQuizExitGuard({ isActive: true, onExit: jest.fn() }));

    const event = new Event('beforeunload', { cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not intercept beforeunload while inactive', () => {
    renderHook(() => useQuizExitGuard({ isActive: false, onExit: jest.fn() }));

    const event = new Event('beforeunload', { cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

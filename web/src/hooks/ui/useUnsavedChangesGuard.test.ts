import { renderHook, act } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

type GuardAction = 'requestLeave' | 'confirmLeave' | 'cancelLeave';

const isOnGuardEntry = () => window.history.state?.unsavedChangesGuard === true;

// Mimics the user pressing back off the guard entry: the browser lands on
// the entry underneath (which carries no guard state) and fires popstate.
// Done by hand rather than through history.back() so that it is not counted
// among the hook's own history.back() calls.
const pressBrowserBack = () => {
  window.history.replaceState(null, '');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

describe('useUnsavedChangesGuard', () => {
  let backSpy: MockInstance;

  beforeEach(() => {
    window.history.replaceState(null, '');
    backSpy = vi.spyOn(window.history, 'back');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each<{
    name: string;
    isEditing: boolean;
    isDirty: boolean;
    actions: GuardAction[];
    expectedShowConfirm: boolean;
    expectedLeaveCalls: number;
    expectedBackCalls: number;
  }>([
    {
      name: 'leaves immediately when not editing',
      isEditing: false,
      isDirty: false,
      actions: ['requestLeave'],
      expectedShowConfirm: false,
      expectedLeaveCalls: 1,
      expectedBackCalls: 0,
    },
    {
      name: 'leaves immediately when editing without changes',
      isEditing: true,
      isDirty: false,
      actions: ['requestLeave'],
      expectedShowConfirm: false,
      expectedLeaveCalls: 1,
      expectedBackCalls: 0,
    },
    {
      name: 'asks for confirmation instead of leaving when dirty',
      isEditing: true,
      isDirty: true,
      actions: ['requestLeave'],
      expectedShowConfirm: true,
      expectedLeaveCalls: 0,
      expectedBackCalls: 0,
    },
    {
      name: 'hides the confirmation and leaves once confirmed',
      isEditing: true,
      isDirty: true,
      actions: ['requestLeave', 'confirmLeave'],
      expectedShowConfirm: false,
      expectedLeaveCalls: 1,
      expectedBackCalls: 0,
    },
    {
      name: 'hides the confirmation without leaving when cancelled',
      isEditing: true,
      isDirty: true,
      actions: ['requestLeave', 'cancelLeave'],
      expectedShowConfirm: false,
      expectedLeaveCalls: 0,
      expectedBackCalls: 0,
    },
  ])(
    'in-app leave: $name',
    ({
      isEditing,
      isDirty,
      actions,
      expectedShowConfirm,
      expectedLeaveCalls,
      expectedBackCalls,
    }) => {
      const onLeave = vi.fn();
      const { result } = renderHook(() =>
        useUnsavedChangesGuard({ isEditing, isDirty, onLeave }),
      );

      actions.forEach(action => {
        act(() => {
          result.current[action]();
        });
      });

      expect(result.current.showConfirm).toBe(expectedShowConfirm);
      expect(onLeave).toHaveBeenCalledTimes(expectedLeaveCalls);
      expect(backSpy).toHaveBeenCalledTimes(expectedBackCalls);
    },
  );

  it.each<{
    name: string;
    isEditing: boolean;
    isDirty: boolean;
    expectedShowConfirm: boolean;
    expectedBackCalls: number;
    expectedOnGuardEntry: boolean;
  }>([
    {
      name: 'is ignored when not editing',
      isEditing: false,
      isDirty: false,
      expectedShowConfirm: false,
      expectedBackCalls: 0,
      expectedOnGuardEntry: false,
    },
    {
      name: 'is let through with one more step back when there are no changes',
      isEditing: true,
      isDirty: false,
      expectedShowConfirm: false,
      expectedBackCalls: 1,
      expectedOnGuardEntry: false,
    },
    {
      name: 'is cancelled by re-guarding history and asking for confirmation when dirty',
      isEditing: true,
      isDirty: true,
      expectedShowConfirm: true,
      expectedBackCalls: 0,
      expectedOnGuardEntry: true,
    },
  ])(
    'browser back: $name',
    ({
      isEditing,
      isDirty,
      expectedShowConfirm,
      expectedBackCalls,
      expectedOnGuardEntry,
    }) => {
      const onLeave = vi.fn();
      const { result } = renderHook(() =>
        useUnsavedChangesGuard({ isEditing, isDirty, onLeave }),
      );

      act(() => {
        pressBrowserBack();
      });

      expect(result.current.showConfirm).toBe(expectedShowConfirm);
      expect(backSpy).toHaveBeenCalledTimes(expectedBackCalls);
      expect(isOnGuardEntry()).toBe(expectedOnGuardEntry);
      expect(onLeave).not.toHaveBeenCalled();
    },
  );

  it.each<{
    name: string;
    initialIsEditing: boolean;
    nextIsEditing: boolean;
    expectedOnGuardEntryAfterMount: boolean;
    expectedBackCalls: number;
  }>([
    {
      name: 'is not pushed while not editing',
      initialIsEditing: false,
      nextIsEditing: false,
      expectedOnGuardEntryAfterMount: false,
      expectedBackCalls: 0,
    },
    {
      name: 'is pushed once and survives re-renders while editing',
      initialIsEditing: true,
      nextIsEditing: true,
      expectedOnGuardEntryAfterMount: true,
      expectedBackCalls: 0,
    },
    {
      name: 'is popped when editing ends without leaving the page',
      initialIsEditing: true,
      nextIsEditing: false,
      expectedOnGuardEntryAfterMount: true,
      expectedBackCalls: 1,
    },
  ])(
    'guard history entry: $name',
    ({
      initialIsEditing,
      nextIsEditing,
      expectedOnGuardEntryAfterMount,
      expectedBackCalls,
    }) => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      const { rerender } = renderHook(
        ({ isEditing, isDirty }) =>
          useUnsavedChangesGuard({ isEditing, isDirty, onLeave: vi.fn() }),
        { initialProps: { isEditing: initialIsEditing, isDirty: false } },
      );

      expect(isOnGuardEntry()).toBe(expectedOnGuardEntryAfterMount);

      // Flipping isDirty alongside must not push a second guard entry.
      rerender({ isEditing: nextIsEditing, isDirty: true });

      expect(pushStateSpy).toHaveBeenCalledTimes(initialIsEditing ? 1 : 0);
      expect(backSpy).toHaveBeenCalledTimes(expectedBackCalls);
    },
  );

  it('guard history entry: is left alone on unmount once the page has navigated away', () => {
    const { unmount } = renderHook(() =>
      useUnsavedChangesGuard({
        isEditing: true,
        isDirty: false,
        onLeave: vi.fn(),
      }),
    );
    // A router navigation replaces the current history state with its own.
    window.history.pushState({ key: 'next-page' }, '');

    unmount();

    expect(backSpy).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'prompts while dirty', isDirty: true, expectedPrevented: true },
    {
      name: 'does not prompt while clean',
      isDirty: false,
      expectedPrevented: false,
    },
  ])('tab close or refresh: $name', ({ isDirty, expectedPrevented }) => {
    renderHook(() =>
      useUnsavedChangesGuard({ isEditing: true, isDirty, onLeave: vi.fn() }),
    );

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(expectedPrevented);
  });
});

import { renderHook, act } from '@testing-library/react';

import { useReminderNote } from './useReminderNote';

describe('useReminderNote', () => {
  it('starts disabled with empty text', () => {
    const { result } = renderHook(() => useReminderNote());
    expect(result.current.reminderEnabled).toBe(false);
    expect(result.current.reminderText).toBe('');
    expect(result.current.effectiveReminder).toBe('');
    expect(result.current.getPendingReminder()).toBeUndefined();
  });

  it.each([
    {
      name: 'enabled with blank text',
      enabled: true,
      text: '   ',
      effective: '',
      pending: undefined,
    },
    {
      name: 'enabled with padded text',
      enabled: true,
      text: '  call back later  ',
      effective: 'call back later',
      pending: 'call back later',
    },
    {
      name: 'disabled with non-blank text',
      enabled: false,
      text: 'call back later',
      effective: '',
      pending: undefined,
    },
  ])(
    'derives the note to save when $name',
    ({ enabled, text, effective, pending }) => {
      const { result } = renderHook(() => useReminderNote());

      act(() => {
        result.current.setReminderEnabled(enabled);
        result.current.setReminderText(text);
      });

      expect(result.current.effectiveReminder).toBe(effective);
      expect(result.current.getPendingReminder()).toBe(pending);
    },
  );

  it('discards the text when the note is disabled', () => {
    const { result } = renderHook(() => useReminderNote());

    act(() => {
      result.current.initReminder('call back later');
    });
    act(() => {
      result.current.setReminderEnabled(false);
    });

    expect(result.current.reminderText).toBe('');
  });

  it.each([
    { name: 'an existing note', reminder: 'call back later', enabled: true },
    { name: 'no note', reminder: '', enabled: false },
  ])('initReminder starts from $name', ({ reminder, enabled }) => {
    const { result } = renderHook(() => useReminderNote());

    act(() => {
      result.current.initReminder(reminder);
    });

    expect(result.current.reminderEnabled).toBe(enabled);
    expect(result.current.reminderText).toBe(reminder);
  });

  it('resetReminder clears both fields', () => {
    const { result } = renderHook(() => useReminderNote());

    act(() => {
      result.current.initReminder('call back later');
    });
    act(() => {
      result.current.resetReminder();
    });

    expect(result.current.reminderEnabled).toBe(false);
    expect(result.current.reminderText).toBe('');
  });

  it('keeps function identities stable across unrelated renders', () => {
    const { result, rerender } = renderHook(() => useReminderNote());
    const first = result.current;

    rerender();

    expect(result.current.setReminderEnabled).toBe(first.setReminderEnabled);
    expect(result.current.initReminder).toBe(first.initReminder);
    expect(result.current.resetReminder).toBe(first.resetReminder);
    expect(result.current.getPendingReminder).toBe(first.getPendingReminder);
  });
});

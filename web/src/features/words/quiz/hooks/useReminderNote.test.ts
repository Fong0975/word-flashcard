import { renderHook, act } from '@testing-library/react';

import { useReminderNote } from './useReminderNote';

describe('useReminderNote', () => {
  it('starts disabled with empty text', () => {
    const { result } = renderHook(() => useReminderNote());
    expect(result.current.reminderEnabled).toBe(false);
    expect(result.current.reminderText).toBe('');
    expect(result.current.getPendingReminder()).toBeUndefined();
  });

  it('returns undefined when enabled but the text is blank', () => {
    const { result } = renderHook(() => useReminderNote());

    act(() => {
      result.current.setReminderEnabled(true);
      result.current.setReminderText('   ');
    });

    expect(result.current.getPendingReminder()).toBeUndefined();
  });

  it('returns the trimmed text when enabled with non-blank text', () => {
    const { result } = renderHook(() => useReminderNote());

    act(() => {
      result.current.setReminderEnabled(true);
      result.current.setReminderText('  call back later  ');
    });

    expect(result.current.getPendingReminder()).toBe('call back later');
  });

  it('returns undefined when disabled even with non-blank text', () => {
    const { result } = renderHook(() => useReminderNote());

    act(() => {
      result.current.setReminderText('call back later');
    });

    expect(result.current.getPendingReminder()).toBeUndefined();
  });

  it('resetReminder clears both fields', () => {
    const { result } = renderHook(() => useReminderNote());

    act(() => {
      result.current.setReminderEnabled(true);
      result.current.setReminderText('call back later');
    });
    act(() => {
      result.current.resetReminder();
    });

    expect(result.current.reminderEnabled).toBe(false);
    expect(result.current.reminderText).toBe('');
  });
});

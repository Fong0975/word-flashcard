import { useCallback, useState } from 'react';

interface UseReminderNoteReturn {
  reminderEnabled: boolean;
  reminderText: string;
  /** The note that would be saved: trimmed, or empty when disabled. */
  effectiveReminder: string;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderText: (text: string) => void;
  initReminder: (reminder: string) => void;
  resetReminder: () => void;
  getPendingReminder: () => string | undefined;
}

/**
 * Tracks an optional reminder note: whether it is enabled and what it says.
 * Disabling the note discards its text. Every returned function keeps a stable
 * identity until the value it reads changes, so it is safe to list as an
 * effect dependency.
 */
export const useReminderNote = (): UseReminderNoteReturn => {
  const [reminderEnabled, setEnabled] = useState(false);
  const [reminderText, setReminderText] = useState('');

  const effectiveReminder = reminderEnabled ? reminderText.trim() : '';

  const setReminderEnabled = useCallback((enabled: boolean) => {
    setEnabled(enabled);
    if (!enabled) {
      setReminderText('');
    }
  }, []);

  const initReminder = useCallback((reminder: string) => {
    setEnabled(Boolean(reminder));
    setReminderText(reminder);
  }, []);

  const resetReminder = useCallback(() => initReminder(''), [initReminder]);

  const getPendingReminder = useCallback(
    (): string | undefined => effectiveReminder || undefined,
    [effectiveReminder],
  );

  return {
    reminderEnabled,
    reminderText,
    effectiveReminder,
    setReminderEnabled,
    setReminderText,
    initReminder,
    resetReminder,
    getPendingReminder,
  };
};

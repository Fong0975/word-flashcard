import { useState } from 'react';

interface UseReminderNoteReturn {
  reminderEnabled: boolean;
  reminderText: string;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderText: (text: string) => void;
  resetReminder: () => void;
  getPendingReminder: () => string | undefined;
}

/**
 * Tracks the optional reminder note a user can attach when rating a word's
 * familiarity during a quiz.
 */
export const useReminderNote = (): UseReminderNoteReturn => {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderText, setReminderText] = useState('');

  const resetReminder = () => {
    setReminderEnabled(false);
    setReminderText('');
  };

  const getPendingReminder = (): string | undefined =>
    reminderEnabled && reminderText.trim() ? reminderText.trim() : undefined;

  return {
    reminderEnabled,
    reminderText,
    setReminderEnabled,
    setReminderText,
    resetReminder,
    getPendingReminder,
  };
};

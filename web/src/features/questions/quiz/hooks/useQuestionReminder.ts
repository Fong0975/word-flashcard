import { useCallback, useState } from 'react';

import { apiService } from '../../../../lib/api';
import { getApiErrorMessage } from '../../../../lib/apiErrorMessage';
import { useReminderNote } from '../../../shared/hooks/useReminderNote';

interface UseQuestionReminderOptions {
  onError?: (message: string) => void;
}

/**
 * Manages the reminder note attached to the question under review during a
 * quiz, including saving it. A failed save is exposed through `saveError`
 * instead of ending the quiz, so the user can retry or drop the note.
 *
 * @param options.onError - Also notified when saving fails
 * @returns The note state, `saveReminder` (resolves to whether it was saved)
 *   and `resetReminder`, which clears both the note and the error
 */
export const useQuestionReminder = ({
  onError,
}: UseQuestionReminderOptions = {}) => {
  const {
    reminderEnabled,
    reminderText,
    setReminderEnabled,
    setReminderText,
    resetReminder: resetNote,
    getPendingReminder,
  } = useReminderNote();
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveReminder = useCallback(
    async (questionId: number, reminder: string): Promise<boolean> => {
      setSaveError(null);
      try {
        await apiService.updateQuestionReminder(questionId, reminder);
        return true;
      } catch (error) {
        const message = `Failed to save reminder: ${getApiErrorMessage(error)}`;
        setSaveError(message);
        onError?.(message);
        return false;
      }
    },
    [onError],
  );

  const resetReminder = useCallback(() => {
    resetNote();
    setSaveError(null);
  }, [resetNote]);

  return {
    reminderEnabled,
    reminderText,
    setReminderEnabled,
    setReminderText,
    getPendingReminder,
    saveReminder,
    saveError,
    resetReminder,
  };
};

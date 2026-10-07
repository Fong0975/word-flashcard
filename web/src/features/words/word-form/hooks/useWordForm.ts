import { useState, useEffect, useCallback } from 'react';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { WordFormData } from '../types';

interface UseWordFormProps {
  mode: 'create' | 'edit';
  word?: Word;
  isOpen: boolean;
}

interface WordFormInitialValues {
  word: string;
  familiarity: FamiliarityLevel;
  reminder: string;
}

/**
 * Returns the values the form starts from: the word being edited, or blanks
 * when creating (or when edit mode has no word yet).
 *
 * @param mode - Whether the form creates a new word or edits an existing one
 * @param word - The word being edited, if any
 * @returns The starting word text, familiarity and reminder note
 */
const getInitialValues = (
  mode: 'create' | 'edit',
  word?: Word,
): WordFormInitialValues =>
  mode === 'edit' && word
    ? {
        word: word.word,
        familiarity: word.familiarity || FamiliarityLevel.GREEN,
        reminder: word.reminder ?? '',
      }
    : { word: '', familiarity: FamiliarityLevel.GREEN, reminder: '' };

export const useWordForm = ({ mode, word, isOpen }: UseWordFormProps) => {
  const [formData, setFormData] = useState<WordFormData>({
    word: '',
    familiarity: FamiliarityLevel.GREEN,
  });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderText, setReminderText] = useState('');

  // Initialize form values when modal opens or word changes
  useEffect(() => {
    if ((mode === 'edit' && word) || mode === 'create') {
      const initial = getInitialValues(mode, word);
      setFormData({ word: initial.word, familiarity: initial.familiarity });
      setReminderEnabled(Boolean(initial.reminder));
      setReminderText(initial.reminder);
    }
  }, [mode, word, isOpen]);

  // Form field handlers
  const handleWordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, word: value.toLowerCase() }));
  }, []);

  const handleFamiliarityChange = useCallback(
    (familiarity: FamiliarityLevel) => {
      setFormData(prev => ({ ...prev, familiarity }));
    },
    [],
  );

  const handleReminderEnabledChange = useCallback((enabled: boolean) => {
    setReminderEnabled(enabled);
    if (!enabled) {
      setReminderText('');
    }
  }, []);

  const handleReminderTextChange = useCallback((text: string) => {
    setReminderText(text);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      word: '',
      familiarity: FamiliarityLevel.GREEN,
    });
    setReminderEnabled(false);
    setReminderText('');
  }, []);

  // Form validation
  const isValid = Boolean(formData.word.trim());

  // Compared against what submitting would actually send, so that ticking the
  // reminder checkbox without typing a note does not count as a change.
  const initialValues = getInitialValues(mode, word);
  const effectiveReminder = reminderEnabled ? reminderText.trim() : '';
  const isDirty =
    formData.word !== initialValues.word ||
    formData.familiarity !== initialValues.familiarity ||
    effectiveReminder !== initialValues.reminder.trim();

  return {
    formData,
    isValid,
    isDirty,
    reminderState: { reminderEnabled, reminderText },
    handlers: {
      handleWordChange,
      handleFamiliarityChange,
      handleReminderEnabledChange,
      handleReminderTextChange,
    },
    resetForm,
  };
};

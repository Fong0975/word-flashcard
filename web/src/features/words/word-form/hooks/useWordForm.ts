import { useState, useEffect, useCallback } from 'react';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { WordFormData } from '../types';

interface UseWordFormProps {
  mode: 'create' | 'edit';
  word?: Word;
  isOpen: boolean;
}

export const useWordForm = ({ mode, word, isOpen }: UseWordFormProps) => {
  const [formData, setFormData] = useState<WordFormData>({
    word: '',
    familiarity: FamiliarityLevel.GREEN,
  });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderText, setReminderText] = useState('');

  // Initialize form values when modal opens or word changes
  useEffect(() => {
    if (mode === 'edit' && word) {
      setFormData({
        word: word.word,
        familiarity: word.familiarity || FamiliarityLevel.GREEN,
      });
      setReminderEnabled(Boolean(word.reminder));
      setReminderText(word.reminder ?? '');
    } else if (mode === 'create') {
      setFormData({
        word: '',
        familiarity: FamiliarityLevel.GREEN,
      });
      setReminderEnabled(false);
      setReminderText('');
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

  return {
    formData,
    isValid,
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

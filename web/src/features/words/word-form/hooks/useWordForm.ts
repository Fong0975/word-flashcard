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

  // Initialize form values when modal opens or word changes
  useEffect(() => {
    if (mode === 'edit' && word) {
      setFormData({
        word: word.word,
        familiarity: word.familiarity || FamiliarityLevel.GREEN,
      });
    } else if (mode === 'create') {
      setFormData({
        word: '',
        familiarity: FamiliarityLevel.GREEN,
      });
    }
  }, [mode, word, isOpen]);

  // Form field handlers
  const handleWordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, word: value }));
  }, []);

  const handleFamiliarityChange = useCallback((familiarity: FamiliarityLevel) => {
    setFormData(prev => ({ ...prev, familiarity }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      word: '',
      familiarity: FamiliarityLevel.GREEN,
    });
  }, []);

  // Form validation
  const isValid = Boolean(formData.word.trim());

  return {
    formData,
    isValid,
    handlers: {
      handleWordChange,
      handleFamiliarityChange,
    },
    resetForm,
  };
};
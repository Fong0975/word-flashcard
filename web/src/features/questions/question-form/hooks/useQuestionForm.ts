import { useState, useEffect, useCallback } from 'react';

import { Question } from '../../../../types/api';
import { QuestionFormData, AnswerOption } from '../types';
import { validateQuestionForm } from '../utils';

interface UseQuestionFormProps {
  mode: 'create' | 'edit';
  question?: Question;
  isOpen: boolean;
}

export const useQuestionForm = ({
  mode,
  question,
  isOpen,
}: UseQuestionFormProps) => {
  const [formData, setFormData] = useState<QuestionFormData>({
    question: '',
    answer: '',
    options: {
      A: '',
      B: '',
      C: '',
      D: '',
    },
    notes: '',
    reference: '',
  });

  // Initialize form values when modal opens or question changes
  useEffect(() => {
    if (mode === 'edit' && question) {
      setFormData({
        question: question.question,
        answer: question.answer,
        options: {
          A: question.option_a,
          B: question.option_b || '',
          C: question.option_c || '',
          D: question.option_d || '',
        },
        notes: question.notes,
        reference: question.reference,
      });
    } else if (mode === 'create') {
      setFormData({
        question: '',
        answer: '',
        options: {
          A: '',
          B: '',
          C: '',
          D: '',
        },
        notes: '',
        reference: '',
      });
    }
  }, [mode, question, isOpen]);

  // Form field handlers
  const handleQuestionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, question: value }));
  }, []);

  const handleAnswerChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, answer: value }));
  }, []);

  const handleOptionChange = useCallback(
    (option: AnswerOption, value: string) => {
      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          [option]: value,
        },
      }));
    },
    [],
  );

  const handleNotesChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, notes: value }));
  }, []);

  const handleReferenceChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, reference: value }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      question: '',
      answer: '',
      options: {
        A: '',
        B: '',
        C: '',
        D: '',
      },
      notes: '',
      reference: '',
    });
  }, []);

  // Form validation
  const validationError = validateQuestionForm(formData);
  const isValid = validationError === null;

  return {
    formData,
    isValid,
    validationError,
    handlers: {
      handleQuestionChange,
      handleAnswerChange,
      handleOptionChange,
      handleNotesChange,
      handleReferenceChange,
    },
    resetForm,
  };
};

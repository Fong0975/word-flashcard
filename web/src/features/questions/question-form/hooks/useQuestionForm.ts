import { useState, useEffect, useCallback } from 'react';

import { Question } from '../../../../types/api';
import { appendTemplateText } from '../../../../utils/textTemplates';
import { QuestionFormData, AnswerOption } from '../types';
import { validateQuestionForm } from '../utils';

interface UseQuestionFormProps {
  mode: 'create' | 'edit';
  question?: Question;
  isOpen: boolean;
}

const createEmptyFormData = (): QuestionFormData => ({
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

/**
 * Returns the form data the form starts from: the question being edited, or
 * a blank form when creating (or when edit mode has no question yet).
 *
 * @param mode - Whether the form creates a new question or edits an existing one
 * @param question - The question being edited, if any
 * @returns The starting form data
 */
const getInitialFormData = (
  mode: 'create' | 'edit',
  question?: Question,
): QuestionFormData =>
  mode === 'edit' && question
    ? {
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
      }
    : createEmptyFormData();

/**
 * Checks whether two form data values hold the same content.
 *
 * @param a - First form data
 * @param b - Second form data
 * @returns True when every field matches
 */
const isSameFormData = (a: QuestionFormData, b: QuestionFormData): boolean =>
  a.question === b.question &&
  a.answer === b.answer &&
  a.options.A === b.options.A &&
  a.options.B === b.options.B &&
  a.options.C === b.options.C &&
  a.options.D === b.options.D &&
  (a.notes ?? '') === (b.notes ?? '') &&
  (a.reference ?? '') === (b.reference ?? '');

export const useQuestionForm = ({
  mode,
  question,
  isOpen,
}: UseQuestionFormProps) => {
  const [formData, setFormData] =
    useState<QuestionFormData>(createEmptyFormData);

  // Initialize form values when modal opens or question changes
  useEffect(() => {
    if ((mode === 'edit' && question) || mode === 'create') {
      setFormData(getInitialFormData(mode, question));
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

  // Append template text to fields
  const appendToNotes = useCallback((textToAppend: string) => {
    setFormData(prev => ({
      ...prev,
      notes: appendTemplateText(prev.notes, textToAppend),
    }));
  }, []);

  const setReferenceFromTemplate = useCallback((templateText: string) => {
    setFormData(prev => ({
      ...prev,
      reference: templateText,
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(createEmptyFormData());
  }, []);

  // Form validation
  const validationError = validateQuestionForm(formData);
  const isValid = validationError === null;

  const isDirty = !isSameFormData(formData, getInitialFormData(mode, question));

  return {
    formData,
    isValid,
    isDirty,
    validationError,
    handlers: {
      handleQuestionChange,
      handleAnswerChange,
      handleOptionChange,
      handleNotesChange,
      handleReferenceChange,
      appendToNotes,
      setReferenceFromTemplate,
    },
    resetForm,
  };
};

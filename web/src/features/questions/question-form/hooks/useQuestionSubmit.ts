import { useState, useCallback } from 'react';

import { apiService } from '../../../../lib/api';
import { Question } from '../../../../types/api';
import { QuestionFormData, QuestionFormSubmitCallbacks } from '../types';

interface UseQuestionSubmitProps {
  mode: 'create' | 'edit';
  question?: Question;
  callbacks: QuestionFormSubmitCallbacks;
  resetForm: () => void;
}

export const useQuestionSubmit = ({
  mode,
  question,
  callbacks,
  resetForm,
}: UseQuestionSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = useCallback(
    async (formData: QuestionFormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        let savedQuestion: Question | undefined;

        if (mode === 'create') {
          // Create mode
          savedQuestion = await apiService.createQuestion({
            question: formData.question.trim(),
            answer: formData.answer.trim(),
            option_a: formData.options.A.trim(),
            option_b: formData.options.B.trim() || undefined,
            option_c: formData.options.C.trim() || undefined,
            option_d: formData.options.D.trim() || undefined,
            notes: formData.notes.trim(),
            reference: formData.reference.trim(),
          });
        } else if (mode === 'edit' && question) {
          // Edit mode: preserve practice statistics
          savedQuestion = await apiService.updateQuestion(question.id, {
            question: formData.question.trim(),
            answer: formData.answer.trim(),
            option_a: formData.options.A.trim(),
            option_b: formData.options.B.trim() || '',
            option_c: formData.options.C.trim() || '',
            option_d: formData.options.D.trim() || '',
            notes: formData.notes.trim(),
            reference: formData.reference.trim(),
          });
        }

        // Reset form and close modal
        resetForm();
        setError(null);
        callbacks.onClose();

        // Notify parent component to refresh data and pass the saved question
        if (callbacks.onQuestionSaved) {
          callbacks.onQuestionSaved(savedQuestion);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to ${mode} question`;
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, question, resetForm, callbacks],
  );

  return {
    isSubmitting,
    error,
    handleSubmit,
  };
};

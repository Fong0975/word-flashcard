import { useState, useCallback } from 'react';

import { Question } from '../../../../types/api';
import { apiService } from '../../../../lib/api';
import { useDeleteConfirmation } from '../../../../hooks/ui/useDeleteConfirmation';
import {
  UseQuestionActionsReturn,
  QuestionActionsCallbacks,
} from '../types/question-detail';

interface UseQuestionActionsProps {
  question: Question | null;
  callbacks: QuestionActionsCallbacks;
  onError?: (message: string) => void;
}

export const useQuestionActions = ({
  question,
  callbacks,
  onError,
}: UseQuestionActionsProps): UseQuestionActionsReturn => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use delete confirmation hook
  const deleteConfirmation = useDeleteConfirmation({
    entity: question,
    onDelete: async q => {
      await apiService.deleteQuestion(q.id);
    },
    getConfirmMessage: () =>
      'Are you sure you want to delete this question? This action cannot be undone.',
    onSuccess: () => {
      callbacks.onClose();
      callbacks.onQuestionUpdated?.();
    },
    onError: onError
      ? error => onError(`Delete failed: ${error.message}`)
      : undefined,
  });

  const handleEdit = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  // Refresh current question data
  const refreshQuestion = useCallback(async () => {
    if (!question) {
      return;
    }

    try {
      const updatedQuestion = await apiService.getQuestion(question.id);
      if (callbacks.onQuestionRefreshed) {
        callbacks.onQuestionRefreshed(updatedQuestion);
      }
    } catch (error) {
      if (onError) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        onError('Failed to refresh question: ' + errorMessage);
      }
    }
  }, [question, callbacks, onError]);

  const handleQuestionUpdated = useCallback(async () => {
    // First refresh the current question data
    await refreshQuestion();

    // Then notify parent to refresh the list
    if (callbacks.onQuestionUpdated) {
      callbacks.onQuestionUpdated();
    }
  }, [refreshQuestion, callbacks]);

  const handleDeleteQuestion = useCallback(() => {
    deleteConfirmation.showDeleteConfirm();
  }, [deleteConfirmation]);

  const handleCopyQuestion = useCallback(() => {
    // Copy functionality will be handled by CopyButton component
  }, []);

  return {
    isEditModalOpen,
    deleteConfirmation,
    handleEdit,
    handleCloseEditModal,
    handleQuestionUpdated,
    handleDeleteQuestion,
    handleCopyQuestion,
  };
};

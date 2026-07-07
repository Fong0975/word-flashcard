import { useState, useCallback } from 'react';

import { apiService } from '../../../../lib/api';
import { Word } from '../../../../types/api';
import { useDeleteConfirmation } from '../../../../hooks/ui/useDeleteConfirmation';
import { WordActionsCallbacks } from '../types/word-detail';

interface UseWordActionsProps {
  word: Word | null;
  callbacks: WordActionsCallbacks;
  onClose: () => void;
  onError?: (message: string) => void;
}

export const useWordActions = ({
  word,
  callbacks,
  onClose,
  onError,
}: UseWordActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const deleteConfirmation = useDeleteConfirmation({
    entity: word,
    onDelete: async w => {
      await apiService.deleteWord(w.id);
    },
    getConfirmMessage: () => '',
    onSuccess: () => {
      onClose();
      callbacks.onWordUpdated?.();
    },
    onError: onError
      ? error => onError('Failed to delete word: ' + error.message)
      : undefined,
  });

  const handleEdit = useCallback(() => {
    setIsEditModalOpen(true);
    callbacks.onEdit();
  }, [callbacks]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleWordUpdated = useCallback(() => {
    if (callbacks.onWordUpdated) {
      callbacks.onWordUpdated();
    }
  }, [callbacks]);

  const handleDeleteWord = useCallback(() => {
    deleteConfirmation.showDeleteConfirm();
    callbacks.onDelete();
  }, [deleteConfirmation, callbacks]);

  return {
    isEditModalOpen,
    showDeleteConfirm: deleteConfirmation.showConfirm,
    handleEdit,
    handleCloseEditModal,
    handleWordUpdated,
    handleDeleteWord,
    handleDeleteWordConfirm: deleteConfirmation.confirmDelete,
    handleDeleteWordCancel: deleteConfirmation.cancelDelete,
  };
};

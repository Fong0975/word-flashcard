import { useState, useCallback } from 'react';

import { apiService } from '../../../../lib/api';
import { Word } from '../../../../types/api';
import { WordActionsCallbacks } from '../types/word-detail';

interface UseWordActionsProps {
  word: Word | null;
  callbacks: WordActionsCallbacks;
  onClose: () => void;
  onError?: (message: string) => void;
}

export const useWordActions = ({ word, callbacks, onClose, onError }: UseWordActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    setShowDeleteConfirm(true);
    callbacks.onDelete();
  }, [callbacks]);

  const handleDeleteWordConfirm = useCallback(async () => {
    if (!word) {return;}

    try {
      await apiService.deleteWord(word.id);
      onClose();
      if (callbacks.onWordUpdated) {
        callbacks.onWordUpdated();
      }
    } catch (error) {
      if (onError) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError('Failed to delete word: ' + errorMessage);
      }
    } finally {
      setShowDeleteConfirm(false);
    }
  }, [word, onClose, callbacks, onError]);

  const handleDeleteWordCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  return {
    isEditModalOpen,
    showDeleteConfirm,
    handleEdit,
    handleCloseEditModal,
    handleWordUpdated,
    handleDeleteWord,
    handleDeleteWordConfirm,
    handleDeleteWordCancel,
  };
};
import React from 'react';
import { ConfirmationDialog } from '../../../../components/ui/ConfirmationDialog';
import { Word } from '../../../../types/api';

interface WordDeleteConfirmationProps {
  word: Word;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WordDeleteConfirmation: React.FC<WordDeleteConfirmationProps> = ({
  word,
  isOpen,
  onConfirm,
  onCancel
}) => {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      title="Delete Word"
      message={`Are you sure you want to delete the word "${word.word}"? This will delete the word and all its definitions. This action cannot be undone.`}
      confirmText="Delete Word"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      variant="danger"
    />
  );
};
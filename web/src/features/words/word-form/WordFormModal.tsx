import React, { useEffect, useCallback } from 'react';

import { Modal } from '../../../components/ui/Modal';
import { Word } from '../../../types/api';

import { WordFormModalProps } from './types';
import { useWordForm, useWordSearch, useWordSubmit } from './hooks';
import {
  WordInput,
  SearchSuggestions,
  FamiliaritySelector,
  ErrorMessage,
  FormActions,
} from './components';

export const WordFormModal: React.FC<WordFormModalProps> = ({
  isOpen,
  onClose,
  onWordSaved,
  onOpenWordDetail,
  mode,
  word,
  currentWords = [],
  onError,
  onWarning,
}) => {
  // Hooks
  const formLogic = useWordForm({ mode, word, isOpen });
  const searchLogic = useWordSearch({ mode, editingWord: word, onError });
  const submitLogic = useWordSubmit({
    mode,
    word,
    currentWords,
    callbacks: { onClose, onWordSaved, onOpenWordDetail },
    resetForm: formLogic.resetForm,
    onWarning,
  });

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!submitLogic.isSubmitting) {
      // Cleanup search
      searchLogic.cleanup();
      searchLogic.resetSearch();
      formLogic.resetForm();
      onClose();
    }
  }, [submitLogic.isSubmitting, searchLogic, formLogic, onClose]);

  // Handle word input change (both form and search)
  const handleWordChange = useCallback(
    (value: string) => {
      formLogic.handlers.handleWordChange(value);
      searchLogic.handleWordChange(value);
    },
    [formLogic.handlers, searchLogic],
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestedWord: Word) => {
      if (onOpenWordDetail) {
        // Close current modal and notify parent to open WordDetailModal
        handleClose();
        onOpenWordDetail(suggestedWord);
      }
    },
    [onOpenWordDetail, handleClose],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      submitLogic.handleSubmit(formLogic.formData);
    },
    [submitLogic, formLogic.formData],
  );

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      searchLogic.resetSearch();
    }
  }, [isOpen, searchLogic]);

  const modalTitle = mode === 'create' ? 'Add New Word' : 'Edit Word';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth='md'
      disableBackdropClose={true}
    >
      <form onSubmit={handleSubmit}>
        <div className='space-y-4'>
          {/* Word Input Field */}
          <WordInput
            value={formLogic.formData.word}
            onChange={handleWordChange}
            onSearchChange={searchLogic.handleWordChange}
            disabled={submitLogic.isSubmitting}
            autoFocus={true}
          />

          {/* Search Suggestions */}
          <SearchSuggestions
            searchState={searchLogic.searchState}
            mode={mode}
            onSuggestionClick={handleSuggestionClick}
          />

          {/* Familiarity Selector - Only show in edit mode */}
          <FamiliaritySelector
            value={formLogic.formData.familiarity}
            onChange={formLogic.handlers.handleFamiliarityChange}
            disabled={submitLogic.isSubmitting}
            mode={mode}
          />

          {/* Error Message */}
          <ErrorMessage error={submitLogic.error} />

          {/* Action Buttons */}
          <FormActions
            mode={mode}
            isSubmitting={submitLogic.isSubmitting}
            isFormValid={formLogic.isValid}
            onCancel={handleClose}
            onSubmit={handleSubmit}
          />
        </div>
      </form>
    </Modal>
  );
};

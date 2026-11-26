import React, { useEffect, useCallback } from 'react';

import { Modal } from '../../../components/ui/Modal';
import { FormActions } from '../../../components/ui/FormActions';
import { FormErrorMessage } from '../../../components/ui/FormErrorMessage';
import { UnsavedChangesDialog } from '../../../components/ui/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '../../../hooks/ui/useUnsavedChangesGuard';
import { Word } from '../../../types/api';
import { ReminderFormField } from '../../shared/components/ReminderFormField';

import { WordFormModalProps } from './types';
import { useWordForm, useWordSearch, useWordSubmit } from './hooks';
import {
  WordInput,
  SearchSuggestions,
  FamiliaritySelector,
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
  }, [submitLogic.isSubmitting, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const unsavedChangesGuard = useUnsavedChangesGuard({
    isEditing: isOpen,
    isDirty: isOpen && formLogic.isDirty,
    onLeave: handleClose,
  });

  // Handle word input change (both form and search)
  const handleWordChange = useCallback(
    (value: string) => {
      formLogic.handlers.handleWordChange(value);
      searchLogic.handleWordChange(value);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestedWord: Word) => {
      if (onOpenWordDetail) {
        // Close current modal and navigate to word detail page
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
      submitLogic.handleSubmit({
        ...formLogic.formData,
        reminder: formLogic.effectiveReminder,
      });
    },
    [submitLogic.handleSubmit, formLogic.formData, formLogic.effectiveReminder], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      searchLogic.resetSearch();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const modalTitle = mode === 'create' ? 'Add New Word' : 'Edit Word';

  return (
    <Modal
      isOpen={isOpen}
      onClose={unsavedChangesGuard.requestLeave}
      title={modalTitle}
      maxWidth='md'
      disableBackdropClose={true}
    >
      <form onSubmit={handleSubmit}>
        <div className='space-y-6'>
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

          {/* Reminder Note - Only show in edit mode */}
          {mode === 'edit' && (
            <ReminderFormField
              description='Have a note to remember? Set a reminder before rating.'
              enabled={formLogic.reminderState.reminderEnabled}
              text={formLogic.reminderState.reminderText}
              onEnabledChange={formLogic.handlers.handleReminderEnabledChange}
              onTextChange={formLogic.handlers.handleReminderTextChange}
              disabled={submitLogic.isSubmitting}
            />
          )}

          <div className='space-y-3 pt-6'>
            {/* Error Message */}
            <FormErrorMessage error={submitLogic.error} />

            {/* Action Buttons */}
            <FormActions
              mode={mode}
              entityLabel='Word'
              isSubmitting={submitLogic.isSubmitting}
              isFormValid={formLogic.isValid}
              onCancel={handleClose}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </form>

      <UnsavedChangesDialog
        isOpen={unsavedChangesGuard.showConfirm}
        onConfirm={unsavedChangesGuard.confirmLeave}
        onCancel={unsavedChangesGuard.cancelLeave}
      />
    </Modal>
  );
};

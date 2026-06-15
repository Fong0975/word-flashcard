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
  }, [submitLogic.isSubmitting, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const { reminderEnabled, reminderText } = formLogic.reminderState;
      const reminder =
        reminderEnabled && reminderText.trim() ? reminderText.trim() : '';
      submitLogic.handleSubmit({ ...formLogic.formData, reminder });
    },
    [submitLogic.handleSubmit, formLogic.formData, formLogic.reminderState], // eslint-disable-line react-hooks/exhaustive-deps
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
      onClose={handleClose}
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
            <div>
              <p className='mb-1 text-sm font-medium text-gray-700 dark:text-gray-300'>
                Reminder
              </p>
              <p className='mb-2 text-xs text-gray-500 dark:text-gray-400'>
                Have a note to remember? Set a reminder before rating.
              </p>
              <div className='space-y-2 pl-3'>
                <label className='flex cursor-pointer items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={formLogic.reminderState.reminderEnabled}
                    onChange={e =>
                      formLogic.handlers.handleReminderEnabledChange(
                        e.target.checked,
                      )
                    }
                    disabled={submitLogic.isSubmitting}
                    className='h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-gray-500'
                  />
                  <span className='text-sm text-gray-600 dark:text-gray-400'>
                    Set a reminder note
                  </span>
                </label>
                <input
                  type='text'
                  value={formLogic.reminderState.reminderText}
                  onChange={e =>
                    formLogic.handlers.handleReminderTextChange(e.target.value)
                  }
                  disabled={
                    !formLogic.reminderState.reminderEnabled ||
                    submitLogic.isSubmitting
                  }
                  placeholder='Enter reminder note...'
                  maxLength={100}
                  className='w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500'
                />
              </div>
            </div>
          )}

          <div className='space-y-3 pt-6'>
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
        </div>
      </form>
    </Modal>
  );
};

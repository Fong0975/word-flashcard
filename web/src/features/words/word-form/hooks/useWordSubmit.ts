import { useState, useCallback } from 'react';

import { apiService } from '../../../../lib/api';
import { Word } from '../../../../types/api';
import { WordFormData, WordFormSubmitCallbacks } from '../types';
import { createExactWordSearchFilter } from '../utils';

interface UseWordSubmitProps {
  mode: 'create' | 'edit';
  word?: Word;
  currentWords?: Word[];
  callbacks: WordFormSubmitCallbacks;
  resetForm: () => void;
  onWarning?: (message: string) => void;
}

export const useWordSubmit = ({
  mode,
  word,
  currentWords = [],
  callbacks,
  resetForm,
  onWarning,
}: UseWordSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle newly created word logic
  const handleNewlyCreatedWord = useCallback(
    async (newWordText: string) => {
      if (mode !== 'create' || !callbacks.onOpenWordDetail) {
        return;
      }

      // Check if the newly created word is already in the current word list
      const isWordInCurrentList = currentWords.some(
        w => w.word.toLowerCase() === newWordText.toLowerCase(),
      );

      if (!isWordInCurrentList) {
        try {
          // Search for the newly created word
          const searchFilter = createExactWordSearchFilter(newWordText);
          const searchResults = await apiService.searchWords({
            searchFilter,
            limit: 1,
          });

          // If we found the word, open WordDetailModal
          if (searchResults.length > 0) {
            callbacks.onOpenWordDetail(searchResults[0]);
          }
        } catch (searchErr) {
          // If search fails, we don't want to show an error as the word was created successfully
          if (onWarning) {
            const errorMessage =
              searchErr instanceof Error ? searchErr.message : 'Unknown error';
            onWarning(
              'Failed to search for newly created word: ' + errorMessage,
            );
          }
        }
      }
    },
    [mode, currentWords, callbacks, onWarning],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (formData: WordFormData) => {
      if (!formData.word.trim()) {
        setError('Please enter a word');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const newWordText = formData.word.trim();

        if (mode === 'create') {
          // Create mode: only send word field
          await apiService.createWord({
            word: newWordText,
          });
        } else if (mode === 'edit' && word) {
          // Edit mode: send word and familiarity fields
          await apiService.updateWordFields(word.id, {
            word: newWordText,
            familiarity: formData.familiarity,
          });
        }

        // Reset form and close modal
        resetForm();
        setError(null);
        callbacks.onClose();

        // Notify parent component to refresh data
        if (callbacks.onWordSaved) {
          callbacks.onWordSaved();
        }

        // Handle newly created word logic
        await handleNewlyCreatedWord(newWordText);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to ${mode} word`;
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, word, resetForm, callbacks, handleNewlyCreatedWord],
  );

  return {
    isSubmitting,
    error,
    handleSubmit,
  };
};

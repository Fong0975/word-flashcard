import { useCallback } from 'react';

import { apiService } from '../../../../lib/api';
import { WordDefinition } from '../../../../types/api';
import { DefinitionActionsCallbacks } from '../types/word-detail';

interface UseDefinitionActionsProps {
  callbacks: DefinitionActionsCallbacks;
  onError?: (message: string) => void;
}

export const useDefinitionActions = ({ callbacks, onError }: UseDefinitionActionsProps) => {
  const handleNew = useCallback(() => {
    // This will be handled by parent component through onOpenDefinitionModal
  }, []);

  const handleEditDefinition = useCallback((definition: WordDefinition) => {
    callbacks.onEdit(definition);
  }, [callbacks]);

  const handleDeleteDefinition = useCallback(async (definition: WordDefinition) => {
    try {
      await apiService.deleteDefinition(definition.id);
      if (callbacks.onWordUpdated) {
        callbacks.onWordUpdated();
      }
    } catch (error) {
      if (onError) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError('Failed to delete definition: ' + errorMessage);
      }
    }
  }, [callbacks, onError]);

  return {
    handleNew,
    handleEditDefinition,
    handleDeleteDefinition,
  };
};
import { useCallback } from 'react';
import { apiService } from '../../../../lib/api';
import { WordDefinition } from '../../../../types/api';
import { DefinitionActionsCallbacks } from '../types/word-detail';

interface UseDefinitionActionsProps {
  callbacks: DefinitionActionsCallbacks;
}

export const useDefinitionActions = ({ callbacks }: UseDefinitionActionsProps) => {
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
      console.error('Failed to delete definition:', error);
    }
  }, [callbacks]);

  return {
    handleNew,
    handleEditDefinition,
    handleDeleteDefinition
  };
};
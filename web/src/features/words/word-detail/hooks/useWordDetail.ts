import { WordDefinition } from '../../../../types/api';
import { WordDetailModalProps } from '../types/word-detail';

import { useWordActions } from './useWordActions';
import { useDefinitionActions } from './useDefinitionActions';

interface UseWordDetailProps {
  word: WordDetailModalProps['word'];
  onClose: () => void;
  onWordUpdated?: () => void;
  onOpenDefinitionModal?: () => void;
  onOpenEditDefinitionModal?: (definition: WordDefinition) => void;
}

export const useWordDetail = ({
  word,
  onClose,
  onWordUpdated,
  onOpenDefinitionModal,
  onOpenEditDefinitionModal,
}: UseWordDetailProps) => {
  const wordActionsCallbacks = {
    onEdit: () => {}, // Edit action is handled by the hook itself
    onDelete: () => {}, // Delete action is handled by the hook itself
    onWordUpdated,
  };

  const wordActions = useWordActions({
    word,
    callbacks: wordActionsCallbacks,
    onClose,
  });

  const definitionActionsCallbacks = {
    onEdit: (definition: WordDefinition) => {
      if (onOpenEditDefinitionModal) {
        onOpenEditDefinitionModal(definition);
      }
    },
    onDelete: (definition: WordDefinition) => {
      // Delete is handled by the hook itself
    },
    onWordUpdated,
  };

  const definitionActions = useDefinitionActions({
    callbacks: definitionActionsCallbacks,
  });

  const handleNewDefinition = () => {
    if (onOpenDefinitionModal) {
      onOpenDefinitionModal();
    }
  };

  return {
    wordActions,
    definitionActions: {
      ...definitionActions,
      handleNew: handleNewDefinition,
    },
  };
};

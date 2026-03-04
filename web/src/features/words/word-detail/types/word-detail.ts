import { Word, WordDefinition } from '../../../../types/api';

export interface DefinitionCardProps {
  definition: WordDefinition;
  index: number;
  onEdit: (definition: WordDefinition) => void;
  onDelete: (definition: WordDefinition) => void;
}

export interface WordHeaderProps {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
}

export interface FamiliarityBarProps {
  familiarity: string;
}

export interface DefinitionsListProps {
  definitions: readonly WordDefinition[];
  onEdit: (definition: WordDefinition) => void;
  onDelete: (definition: WordDefinition) => void;
  onAddNew: () => void;
}

export interface WordFooterProps {
  word: Word;
}

export interface PronunciationGroupProps {
  phonetics: Record<string, unknown>;
}

export interface WordActionsCallbacks {
  onEdit: () => void;
  onDelete: () => void;
  onWordUpdated?: (newWordText?: string) => void;
}

export interface DefinitionActionsCallbacks {
  onEdit: (definition: WordDefinition) => void;
  onDelete: (definition: WordDefinition) => void;
  onWordUpdated?: () => void;
}

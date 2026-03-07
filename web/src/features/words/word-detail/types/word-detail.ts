import { Word, WordDefinition } from '../../../../types/api';

export interface DefinitionCardProps {
  definition: WordDefinition;
  index: number;
  onEdit: (definition: WordDefinition) => void;
  onDelete: (definition: WordDefinition) => void;
  speechFallback?: SpeechFallback;
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
  wordText: string;
  onEdit: (definition: WordDefinition) => void;
  onDelete: (definition: WordDefinition) => void;
  onAddNew: () => void;
}

export interface SpeechFallback {
  wordText: string;
  uk: boolean;
  us: boolean;
}

export interface WordFooterProps {
  word: Word;
}

export interface PronunciationGroupProps {
  phonetics: Record<string, unknown>;
  speechFallback?: SpeechFallback;
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

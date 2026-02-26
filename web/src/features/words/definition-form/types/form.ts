/**
 * Definition form interfaces and types
 */
import { WordDefinition } from '../../../../types/api';

export interface DefinitionForm {
  part_of_speech: string[];
  definition: string;
  examples: string[];
  notes: string;
  phonetics: { uk?: string; us?: string };
}

export interface DefinitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDefinitionAdded?: () => void;
  onDefinitionUpdated?: () => void;
  wordId: number | null;
  wordText: string | null;
  mode?: 'add' | 'edit';
  definition?: WordDefinition | null;
}

export interface NoteButton {
  label: string;
  value: string;
}
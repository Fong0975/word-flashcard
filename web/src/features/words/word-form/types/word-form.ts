/**
 * Word form interfaces and types
 */
import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';

export interface WordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWordSaved?: () => void;
  onOpenWordDetail?: (word: Word) => void;
  mode: 'create' | 'edit';
  word?: Word; // Required when mode is 'edit'
  currentWords?: Word[]; // Current words in the list to check if newly created word is present
}

export interface WordFormData {
  word: string;
  familiarity: FamiliarityLevel;
}

export interface FamiliarityOption {
  value: FamiliarityLevel;
  label: string;
  color: string;
}

export interface WordSearchState {
  suggestions: Word[];
  isLoading: boolean;
  showSuggestions: boolean;
}

export interface WordFormSubmitCallbacks {
  onClose: () => void;
  onWordSaved?: () => void;
  onOpenWordDetail?: (word: Word) => void;
}
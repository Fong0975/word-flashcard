/**
 * Question form interfaces and types
 */
import { Question } from '../../../../types/api';

export interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionSaved?: (question?: Question) => void;
  mode: 'create' | 'edit';
  question?: Question; // Required when mode is 'edit'
}

export interface QuestionFormData {
  question: string;
  answer: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  notes: string;
  reference: string;
}

export interface QuestionFormSubmitCallbacks {
  onClose: () => void;
  onQuestionSaved?: (question?: Question) => void;
}

export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface OptionInputProps {
  option: AnswerOption;
  value: string;
  onChange: (option: AnswerOption, value: string) => void;
  required?: boolean;
  disabled?: boolean;
}
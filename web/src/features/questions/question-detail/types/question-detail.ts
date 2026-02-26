import { Question } from '../../../../types/api';

export interface QuestionDetailModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated?: () => void;
  onQuestionRefreshed?: (updatedQuestion: Question) => void;
}

export interface QuestionHeaderProps {
  question: Question;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export interface QuestionActionsProps {
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  copyText: string;
}

export interface OptionsDisplayProps {
  options: QuestionOption[];
}

export interface OptionItemProps {
  option: QuestionOption;
}

export interface PracticeStatsProps {
  practiceCount: number;
  failureCount: number;
  accuracyRate: number;
}

export interface AccuracyBadgeProps {
  accuracyRate: number;
}

export interface ReferenceSectionProps {
  reference: string;
}

export interface AnswerSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  answer: string;
  explanation?: string;
  question: Question;
}

export interface CorrectAnswerProps {
  answer: string;
}

export interface ExplanationContentProps {
  explanation: string;
}

export interface QuestionFooterProps {
  question: Question;
}

// Helper type for formatted options
export interface QuestionOption {
  key: string;
  value: string;
}

// Hook return types
export interface UseQuestionStatsReturn {
  accuracyRate: number;
  accuracyRateColor: string;
  availableOptions: QuestionOption[];
  formattedQuestionText: string;
}

export interface UseQuestionActionsReturn {
  isEditModalOpen: boolean;
  deleteConfirmation: any; // Type from useDeleteConfirmation hook
  handleEdit: () => void;
  handleCloseEditModal: () => void;
  handleQuestionUpdated: () => void;
  handleDeleteQuestion: () => void;
  handleCopyQuestion: () => void;
}

export interface QuestionActionsCallbacks {
  onQuestionUpdated?: () => void;
  onQuestionRefreshed?: (updatedQuestion: Question) => void;
  onClose: () => void;
}
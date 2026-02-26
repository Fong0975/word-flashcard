import { useState } from 'react';
import { QuestionDetailModalProps, QuestionActionsCallbacks } from '../types/question-detail';
import { useQuestionStats } from './useQuestionStats';
import { useQuestionActions } from './useQuestionActions';

interface UseQuestionDetailProps {
  question: QuestionDetailModalProps['question'];
  onClose: () => void;
  onQuestionUpdated?: () => void;
  onQuestionRefreshed?: (question: any) => void;
}

export const useQuestionDetail = ({
  question,
  onClose,
  onQuestionUpdated,
  onQuestionRefreshed
}: UseQuestionDetailProps) => {
  const [isAnswerExpanded, setIsAnswerExpanded] = useState(false);

  const stats = useQuestionStats({ question });

  const callbacks: QuestionActionsCallbacks = {
    onClose,
    onQuestionUpdated,
    onQuestionRefreshed
  };

  const actions = useQuestionActions({ question, callbacks });

  const toggleAnswerSection = () => {
    setIsAnswerExpanded(!isAnswerExpanded);
  };

  return {
    isAnswerExpanded,
    toggleAnswerSection,
    stats,
    actions
  };
};
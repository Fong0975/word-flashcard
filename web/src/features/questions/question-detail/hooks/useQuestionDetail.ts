import { useState } from 'react';

import { Question } from '../../../../types/api';
import { QuestionDetailModalProps, QuestionActionsCallbacks } from '../types/question-detail';

import { useQuestionStats } from './useQuestionStats';
import { useQuestionActions } from './useQuestionActions';

interface UseQuestionDetailProps {
  question: QuestionDetailModalProps['question'];
  onClose: () => void;
  onQuestionUpdated?: () => void;
  onQuestionRefreshed?: (question: Question) => void;
  onError?: (message: string) => void;
}

export const useQuestionDetail = ({
  question,
  onClose,
  onQuestionUpdated,
  onQuestionRefreshed,
  onError,
}: UseQuestionDetailProps) => {
  const [isAnswerExpanded, setIsAnswerExpanded] = useState(false);

  const stats = useQuestionStats({ question });

  const callbacks: QuestionActionsCallbacks = {
    onClose,
    onQuestionUpdated,
    onQuestionRefreshed,
  };

  const actions = useQuestionActions({ question, callbacks, onError });

  const toggleAnswerSection = () => {
    setIsAnswerExpanded(!isAnswerExpanded);
  };

  return {
    isAnswerExpanded,
    toggleAnswerSection,
    stats,
    actions,
  };
};
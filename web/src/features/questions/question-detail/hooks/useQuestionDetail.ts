import { useState, useEffect } from 'react';

import { Question } from '../../../../types/api';
import {
  QuestionDetailModalProps,
  QuestionActionsCallbacks,
} from '../types/question-detail';

import { useQuestionStats } from './useQuestionStats';
import { useQuestionActions } from './useQuestionActions';

interface UseQuestionDetailProps {
  question: QuestionDetailModalProps['question'];
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated?: () => void;
  onQuestionRefreshed?: (question: Question) => void;
  onError?: (message: string) => void;
}

export const useQuestionDetail = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated,
  onQuestionRefreshed,
  onError,
}: UseQuestionDetailProps) => {
  const [isAnswerExpanded, setIsAnswerExpanded] = useState(false);

  // Reset answer expanded state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsAnswerExpanded(false);
    }
  }, [isOpen]);

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

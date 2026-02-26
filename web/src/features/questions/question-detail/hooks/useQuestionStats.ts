import { useMemo } from 'react';

import { Question } from '../../../../types/api';
import { UseQuestionStatsReturn } from '../types/question-detail';
import {
  calculateAccuracyRate,
  getAccuracyRateColor,
  getAvailableOptions,
  formatQuestionForCopy,
} from '../utils';

interface UseQuestionStatsProps {
  question: Question | null;
}

export const useQuestionStats = ({ question }: UseQuestionStatsProps): UseQuestionStatsReturn => {
  const stats = useMemo(() => {
    if (!question) {
      return {
        accuracyRate: 0,
        accuracyRateColor: '',
        availableOptions: [],
        formattedQuestionText: '',
      };
    }

    const accuracyRate = calculateAccuracyRate(question.count_practise, question.count_failure_practise);
    const accuracyRateColor = getAccuracyRateColor(accuracyRate);
    const availableOptions = getAvailableOptions(question);
    const formattedQuestionText = formatQuestionForCopy(question);

    return {
      accuracyRate,
      accuracyRateColor,
      availableOptions,
      formattedQuestionText,
    };
  }, [question]);

  return stats;
};
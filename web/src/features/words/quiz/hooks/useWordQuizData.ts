import { useState, useEffect, Dispatch, SetStateAction } from 'react';

import { Word, WordsRandomRequest } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { apiService } from '../../../../lib/api';
import { getApiErrorMessage } from '../../../../lib/apiErrorMessage';

export type WordQuizState = 'loading' | 'quiz' | 'completed';

interface UseWordQuizDataOptions {
  selectedFamiliarity: readonly FamiliarityLevel[];
  questionCount: number;
  perCategoryCounts?: { red: number; yellow: number; green: number };
  onError?: (message: string) => void;
}

interface UseWordQuizDataReturn {
  state: WordQuizState;
  setState: Dispatch<SetStateAction<WordQuizState>>;
  words: Word[];
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
}

/**
 * Fetches the random words for a quiz session, supporting both the
 * per-category-count mode and the total-count-with-familiarity-filter mode.
 */
export const useWordQuizData = ({
  selectedFamiliarity,
  questionCount,
  perCategoryCounts,
  onError,
}: UseWordQuizDataOptions): UseWordQuizDataReturn => {
  const [state, setState] = useState<WordQuizState>('loading');
  const [words, setWords] = useState<Word[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizWords = async () => {
      try {
        setState('loading');
        setError(null);

        let request: WordsRandomRequest;

        if (perCategoryCounts) {
          const total =
            perCategoryCounts[FamiliarityLevel.RED] +
            perCategoryCounts[FamiliarityLevel.YELLOW] +
            perCategoryCounts[FamiliarityLevel.GREEN];

          if (total <= 0) {
            setError(
              'No questions available for quiz. Please add some questions first.',
            );
            return;
          }

          request = { count: total, per_category_counts: perCategoryCounts };
        } else {
          const allSelectedFamiliarity = selectedFamiliarity.filter(f =>
            [
              FamiliarityLevel.RED,
              FamiliarityLevel.YELLOW,
              FamiliarityLevel.GREEN,
            ].includes(f),
          );

          if (questionCount <= 0) {
            setError('Invalid question count.');
            return;
          }

          request = {
            count: questionCount,
            familiarity_levels: allSelectedFamiliarity,
          };
        }

        const randomWords = await apiService.getRandomWords(request);

        if (randomWords.length === 0) {
          setError(
            'No questions available for quiz. Please add some questions first.',
          );
          return;
        }

        setWords(randomWords);
        setState('quiz');
      } catch (error) {
        const errorMessage = getApiErrorMessage(
          error,
          'Failed to load quiz words.',
        );
        setError(errorMessage);
        if (onError) {
          onError('Failed to fetch quiz words: ' + errorMessage);
        }
      }
    };

    fetchQuizWords();
  }, [selectedFamiliarity, questionCount, perCategoryCounts, onError]);

  return { state, setState, words, error, setError };
};

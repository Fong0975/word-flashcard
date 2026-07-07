import { useState, useEffect, Dispatch, SetStateAction } from 'react';

import { Word, WordsRandomRequest } from '../../../../types/api';
import {
  FamiliarityLevel,
  SearchOperation,
  SearchLogic,
} from '../../../../types/base';
import { apiService } from '../../../../lib/api';
import { shuffleArray } from '../../../shared/shuffle';

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

        let randomWords: Word[];

        if (perCategoryCounts) {
          const levels = [
            FamiliarityLevel.RED,
            FamiliarityLevel.YELLOW,
            FamiliarityLevel.GREEN,
          ] as const;
          const requests = levels
            .filter(f => perCategoryCounts[f] > 0)
            .map(f =>
              apiService.getRandomWords({
                count: perCategoryCounts[f],
                filter: {
                  conditions: [
                    {
                      key: 'familiarity',
                      operator: SearchOperation.IN,
                      value: JSON.stringify([f]),
                    },
                  ],
                  logic: SearchLogic.OR,
                },
              }),
            );
          const batches = await Promise.all(requests);
          randomWords = shuffleArray(batches.flat());
        } else {
          const allSelectedFamiliarity = selectedFamiliarity.filter(f =>
            [
              FamiliarityLevel.RED,
              FamiliarityLevel.YELLOW,
              FamiliarityLevel.GREEN,
            ].includes(f),
          );

          const request: WordsRandomRequest = {
            count: questionCount,
            filter: {
              conditions: [
                {
                  key: 'familiarity',
                  operator: SearchOperation.IN,
                  value: JSON.stringify(allSelectedFamiliarity),
                },
              ],
              logic: SearchLogic.OR,
            },
          };

          if (request.count <= 0) {
            setError('Invalid question count.');
            return;
          }

          randomWords = await apiService.getRandomWords(request);
        }

        if (randomWords.length === 0) {
          setError(
            'No questions available for quiz. Please add some questions first.',
          );
          return;
        }

        setWords(randomWords);
        setState('quiz');
      } catch (error) {
        const errorMessage = 'Failed to load quiz words. Please try again.';
        setError(errorMessage);
        if (onError) {
          const detailedMessage =
            error instanceof Error ? error.message : 'Unknown error';
          onError('Failed to fetch quiz words: ' + detailedMessage);
        }
      }
    };

    fetchQuizWords();
  }, [selectedFamiliarity, questionCount, perCategoryCounts, onError]);

  return { state, setState, words, error, setError };
};

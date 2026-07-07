import { useState, useEffect, Dispatch, SetStateAction } from 'react';

import { Question, QuestionsRandomRequest } from '../../../../types/api';
import { apiService } from '../../../../lib/api';

export type QuestionQuizState = 'loading' | 'quiz' | 'completed';

interface UseQuestionQuizDataOptions {
  questionCount: number;
  onError?: (message: string) => void;
}

interface UseQuestionQuizDataReturn {
  state: QuestionQuizState;
  setState: Dispatch<SetStateAction<QuestionQuizState>>;
  questions: Question[];
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
}

/**
 * Fetches the random questions for a quiz session.
 */
export const useQuestionQuizData = ({
  questionCount,
  onError,
}: UseQuestionQuizDataOptions): UseQuestionQuizDataReturn => {
  const [state, setState] = useState<QuestionQuizState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setState('loading');
        setError(null);

        const request: QuestionsRandomRequest = {
          count: questionCount,
          exclude_recent_days: 3,
        };

        const fetchedQuestions = await apiService.getRandomQuestions(request);

        if (fetchedQuestions.length === 0) {
          setError(
            'No questions available for quiz. Please add some questions first.',
          );
          return;
        }

        setQuestions(fetchedQuestions);
        setState('quiz');
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load quiz questions';
        setError(errorMessage);
        if (onError) {
          onError('Failed to fetch quiz questions: ' + errorMessage);
        }
      }
    };

    fetchQuizQuestions();
  }, [questionCount, onError]);

  return { state, setState, questions, error, setError };
};

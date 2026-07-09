import { renderHook, waitFor } from '@testing-library/react';

import { Question } from '../../../../types/api';
import { apiService } from '../../../../lib/api';

import { useQuestionQuizData } from './useQuestionQuizData';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

describe('useQuestionQuizData', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('requests the given count while excluding recently-practiced questions', async () => {
    const getRandomQuestionsSpy = jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);

    renderHook(() => useQuestionQuizData({ questionCount: 10 }));

    await waitFor(() =>
      expect(getRandomQuestionsSpy).toHaveBeenCalledWith({
        count: 10,
        exclude_recent_days: 3,
      }),
    );
  });

  it('transitions to the quiz state with the fetched questions', async () => {
    const questions = [buildQuestion({ id: 1 }), buildQuestion({ id: 2 })];
    jest.spyOn(apiService, 'getRandomQuestions').mockResolvedValue(questions);

    const { result } = renderHook(() =>
      useQuestionQuizData({ questionCount: 10 }),
    );

    await waitFor(() => expect(result.current.state).toBe('quiz'));
    expect(result.current.questions).toEqual(questions);
    expect(result.current.error).toBeNull();
  });

  it('sets an error and stays out of the quiz state when no questions are returned', async () => {
    jest.spyOn(apiService, 'getRandomQuestions').mockResolvedValue([]);

    const { result } = renderHook(() =>
      useQuestionQuizData({ questionCount: 10 }),
    );

    await waitFor(() =>
      expect(result.current.error).toBe(
        'No questions available for quiz. Please add some questions first.',
      ),
    );
    expect(result.current.state).toBe('loading');
  });

  it('sets an error and calls onError when the fetch fails', async () => {
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockRejectedValue(new Error('network down'));
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useQuestionQuizData({ questionCount: 10, onError }),
    );

    await waitFor(() => expect(result.current.error).toBe('network down'));
    expect(result.current.state).toBe('loading');
    expect(onError).toHaveBeenCalledWith(
      'Failed to fetch quiz questions: network down',
    );
  });

  it('re-fetches when questionCount changes', async () => {
    const getRandomQuestionsSpy = jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);

    const { rerender } = renderHook(
      ({ questionCount }: { questionCount: number }) =>
        useQuestionQuizData({ questionCount }),
      { initialProps: { questionCount: 10 } },
    );
    await waitFor(() => expect(getRandomQuestionsSpy).toHaveBeenCalledTimes(1));

    rerender({ questionCount: 20 });

    await waitFor(() => expect(getRandomQuestionsSpy).toHaveBeenCalledTimes(2));
    expect(getRandomQuestionsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ count: 20 }),
    );
  });
});

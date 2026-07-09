import { renderHook, waitFor, act } from '@testing-library/react';

import { apiService } from '../lib/api';
import { Question } from '../types/api';

import { useQuestions } from './useQuestions';

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

describe('useQuestions', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('fetches with the given sort option', async () => {
    jest.spyOn(apiService, 'getAllQuestions').mockResolvedValue([]);
    jest.spyOn(apiService, 'getQuestionsCount').mockResolvedValue({ count: 0 });

    renderHook(() => useQuestions({ sort: 'question_asc' }));

    await waitFor(() =>
      expect(apiService.getAllQuestions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'question_asc' }),
      ),
    );
  });

  it('filters client-side by question text, case-insensitively', async () => {
    const matching = buildQuestion({
      id: 1,
      question: 'What is the capital of France?',
    });
    const nonMatching = buildQuestion({ id: 2, question: 'What is 2 + 2?' });
    jest
      .spyOn(apiService, 'getAllQuestions')
      .mockResolvedValue([matching, nonMatching]);
    jest.spyOn(apiService, 'getQuestionsCount').mockResolvedValue({ count: 2 });

    const { result } = renderHook(() => useQuestions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('FRANCE');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions.map(q => q.id)).toEqual([1]);
  });

  it('filters client-side by any answer option', async () => {
    const matching = buildQuestion({
      id: 1,
      question: 'Pick one',
      option_c: 'Paris',
    });
    const nonMatching = buildQuestion({ id: 2, question: 'Pick another' });
    jest
      .spyOn(apiService, 'getAllQuestions')
      .mockResolvedValue([matching, nonMatching]);
    jest.spyOn(apiService, 'getQuestionsCount').mockResolvedValue({ count: 2 });

    const { result } = renderHook(() => useQuestions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('paris');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions.map(q => q.id)).toEqual([1]);
  });

  it('mirrors entities/fetchEntities as questions/fetchQuestions', async () => {
    const question = buildQuestion();
    jest.spyOn(apiService, 'getAllQuestions').mockResolvedValue([question]);
    jest.spyOn(apiService, 'getQuestionsCount').mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useQuestions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions).toEqual([question]);
    expect(result.current.entities).toEqual([question]);
    expect(result.current.fetchQuestions).toBe(result.current.fetchEntities);
  });
});

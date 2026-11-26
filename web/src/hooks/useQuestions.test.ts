import { renderHook, waitFor, act } from '@testing-library/react';
import type { MockInstance } from 'vitest';

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
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('fetches with the given sort option', async () => {
    vi.spyOn(apiService, 'searchQuestions').mockResolvedValue([]);
    vi.spyOn(apiService, 'getQuestionsCount').mockResolvedValue({ count: 0 });

    renderHook(() => useQuestions({ sort: 'question_asc' }));

    await waitFor(() =>
      expect(apiService.searchQuestions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'question_asc' }),
      ),
    );
  });

  it.each([
    { name: 'a single word', term: 'France', pattern: '%France%' },
    {
      name: 'a trimmed phrase as one keyword',
      term: '  take off ',
      pattern: '%take off%',
    },
    {
      name: 'wildcards matched literally',
      term: '50%_',
      pattern: '%50\\%\\_%',
    },
    { name: 'a blank term without a filter', term: '   ', pattern: null },
  ])(
    'searches the list and count on the server with $name',
    async ({ term, pattern }) => {
      const listSpy = vi
        .spyOn(apiService, 'searchQuestions')
        .mockResolvedValue([]);
      const countSpy = vi
        .spyOn(apiService, 'getQuestionsCount')
        .mockResolvedValue({ count: 0 });
      const expectedFilter =
        pattern === null
          ? undefined
          : {
              conditions: [
                'question',
                'option_a',
                'option_b',
                'option_c',
                'option_d',
              ].map(key => ({ key, operator: 'like', value: pattern })),
              logic: 'OR',
            };

      const { result } = renderHook(() =>
        useQuestions({ initialSearchTerm: term }),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(listSpy.mock.lastCall?.[0]?.searchFilter).toEqual(expectedFilter);
      expect(countSpy).toHaveBeenLastCalledWith(expectedFilter);
    },
  );

  it('keeps the server results without filtering them again', async () => {
    const question = buildQuestion({ question: 'Unrelated text' });
    vi.spyOn(apiService, 'searchQuestions').mockResolvedValue([question]);
    vi.spyOn(apiService, 'getQuestionsCount').mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useQuestions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('paris');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions).toEqual([question]);
  });

  it('mirrors entities/fetchEntities as questions/fetchQuestions', async () => {
    const question = buildQuestion();
    vi.spyOn(apiService, 'searchQuestions').mockResolvedValue([question]);
    vi.spyOn(apiService, 'getQuestionsCount').mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useQuestions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions).toEqual([question]);
    expect(result.current.entities).toEqual([question]);
    expect(result.current.fetchQuestions).toBe(result.current.fetchEntities);
  });
});

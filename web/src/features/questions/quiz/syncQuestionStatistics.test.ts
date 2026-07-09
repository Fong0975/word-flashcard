import { Question, QuestionQuizResult } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { syncQuestionStatistics } from './syncQuestionStatistics';

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

const buildResult = (
  overrides: Partial<QuestionQuizResult> = {},
): QuestionQuizResult => ({
  question: buildQuestion(),
  userAnswer: 'A',
  isCorrect: true,
  updatedStats: { countPractise: 1, countFailurePractise: 0 },
  ...overrides,
});

describe('syncQuestionStatistics', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('updates each question with its refreshed practice/failure counts', async () => {
    const updateQuestion = jest
      .spyOn(apiService, 'updateQuestion')
      .mockResolvedValue(buildQuestion());

    await syncQuestionStatistics([buildResult()]);

    expect(updateQuestion).toHaveBeenCalledWith(1, {
      question: 'What is 2 + 2?',
      answer: 'A',
      option_a: '4',
      option_b: '3',
      option_c: '5',
      option_d: '6',
      notes: '',
      reference: '',
      count_practise: 1,
      count_failure_practise: 0,
    });
  });

  it('falls back to empty strings for missing options', async () => {
    const updateQuestion = jest
      .spyOn(apiService, 'updateQuestion')
      .mockResolvedValue(buildQuestion());
    const result = buildResult({
      question: buildQuestion({
        option_b: undefined,
        option_c: undefined,
        option_d: undefined,
      }),
    });

    await syncQuestionStatistics([result]);

    expect(updateQuestion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ option_b: '', option_c: '', option_d: '' }),
    );
  });

  it('processes results in order', async () => {
    const updateQuestion = jest
      .spyOn(apiService, 'updateQuestion')
      .mockResolvedValue(buildQuestion());
    const first = buildResult({ question: buildQuestion({ id: 1 }) });
    const second = buildResult({ question: buildQuestion({ id: 2 }) });

    await syncQuestionStatistics([first, second]);

    expect(updateQuestion.mock.calls[0][0]).toBe(1);
    expect(updateQuestion.mock.calls[1][0]).toBe(2);
  });

  it('reports a formatted error message and does not throw when an update fails', async () => {
    jest
      .spyOn(apiService, 'updateQuestion')
      .mockRejectedValue(new Error('network down'));
    const onError = jest.fn();

    await expect(
      syncQuestionStatistics([buildResult()], onError),
    ).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledWith(
      'Failed to update question statistics: network down',
    );
  });

  it('swallows the error silently when no onError callback is provided', async () => {
    jest
      .spyOn(apiService, 'updateQuestion')
      .mockRejectedValue(new Error('network down'));

    await expect(
      syncQuestionStatistics([buildResult()]),
    ).resolves.toBeUndefined();
  });

  it('stops processing subsequent results after a failure', async () => {
    const updateQuestion = jest
      .spyOn(apiService, 'updateQuestion')
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(buildQuestion());
    const first = buildResult({ question: buildQuestion({ id: 1 }) });
    const second = buildResult({ question: buildQuestion({ id: 2 }) });

    await syncQuestionStatistics([first, second]);

    expect(updateQuestion).toHaveBeenCalledTimes(1);
  });
});

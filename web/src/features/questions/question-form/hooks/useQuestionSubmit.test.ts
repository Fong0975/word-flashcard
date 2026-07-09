import { renderHook, act } from '@testing-library/react';

import { Question } from '../../../../types/api';
import { apiService } from '../../../../lib/api';
import { QuestionFormData, QuestionFormSubmitCallbacks } from '../types';

import { useQuestionSubmit } from './useQuestionSubmit';

const buildFormData = (
  overrides: Partial<QuestionFormData> = {},
): QuestionFormData => ({
  question: '  What is 2 + 2?  ',
  answer: ' A ',
  options: { A: ' 4 ', B: '', C: '', D: '' },
  notes: ' notes ',
  reference: ' ref ',
  ...overrides,
});

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

const buildCallbacks = (
  overrides: Partial<QuestionFormSubmitCallbacks> = {},
): QuestionFormSubmitCallbacks => ({
  onClose: jest.fn(),
  ...overrides,
});

describe('useQuestionSubmit', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('creates a question with trimmed fields and undefined for blank options', async () => {
    const createQuestionSpy = jest
      .spyOn(apiService, 'createQuestion')
      .mockResolvedValue(buildQuestion());
    const resetForm = jest.fn();
    const onClose = jest.fn();
    const onQuestionSaved = jest.fn();
    const { result } = renderHook(() =>
      useQuestionSubmit({
        mode: 'create',
        callbacks: buildCallbacks({ onClose, onQuestionSaved }),
        resetForm,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData());
    });

    expect(createQuestionSpy).toHaveBeenCalledWith({
      question: 'What is 2 + 2?',
      answer: 'A',
      option_a: '4',
      option_b: undefined,
      option_c: undefined,
      option_d: undefined,
      notes: 'notes',
      reference: 'ref',
    });
    expect(resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onQuestionSaved).toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates a question with empty strings for blank options in edit mode', async () => {
    const question = buildQuestion();
    const updateQuestionSpy = jest
      .spyOn(apiService, 'updateQuestion')
      .mockResolvedValue(question);
    const { result } = renderHook(() =>
      useQuestionSubmit({
        mode: 'edit',
        question,
        callbacks: buildCallbacks(),
        resetForm: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData());
    });

    expect(updateQuestionSpy).toHaveBeenCalledWith(1, {
      question: 'What is 2 + 2?',
      answer: 'A',
      option_a: '4',
      option_b: '',
      option_c: '',
      option_d: '',
      notes: 'notes',
      reference: 'ref',
    });
  });

  it('sets an error message and does not close on failure', async () => {
    jest
      .spyOn(apiService, 'createQuestion')
      .mockRejectedValue(new Error('network down'));
    const onClose = jest.fn();
    const resetForm = jest.fn();
    const { result } = renderHook(() =>
      useQuestionSubmit({
        mode: 'create',
        callbacks: buildCallbacks({ onClose }),
        resetForm,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData());
    });

    expect(result.current.error).toBe('network down');
    expect(result.current.isSubmitting).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    expect(resetForm).not.toHaveBeenCalled();
  });
});

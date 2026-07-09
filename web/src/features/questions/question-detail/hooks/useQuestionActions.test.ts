import { renderHook, act, waitFor } from '@testing-library/react';

import { Question } from '../../../../types/api';
import { apiService } from '../../../../lib/api';
import { QuestionActionsCallbacks } from '../types/question-detail';

import { useQuestionActions } from './useQuestionActions';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 10,
  notes: '',
  reference: '',
  ...overrides,
});

const buildCallbacks = (
  overrides: Partial<QuestionActionsCallbacks> = {},
): QuestionActionsCallbacks => ({
  onClose: jest.fn(),
  ...overrides,
});

describe('useQuestionActions', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('toggles the edit modal open and closed', () => {
    const { result } = renderHook(() =>
      useQuestionActions({
        question: buildQuestion(),
        callbacks: buildCallbacks(),
      }),
    );

    act(() => {
      result.current.handleEdit();
    });
    expect(result.current.isEditModalOpen).toBe(true);

    act(() => {
      result.current.handleCloseEditModal();
    });
    expect(result.current.isEditModalOpen).toBe(false);
  });

  it('opens the delete confirmation when handleDeleteQuestion is called', () => {
    const { result } = renderHook(() =>
      useQuestionActions({
        question: buildQuestion(),
        callbacks: buildCallbacks(),
      }),
    );

    act(() => {
      result.current.handleDeleteQuestion();
    });

    expect(result.current.deleteConfirmation.showConfirm).toBe(true);
  });

  it('deletes the question and notifies the parent on confirm', async () => {
    const deleteQuestionSpy = jest
      .spyOn(apiService, 'deleteQuestion')
      .mockResolvedValue(undefined);
    const onClose = jest.fn();
    const onQuestionUpdated = jest.fn();
    const { result } = renderHook(() =>
      useQuestionActions({
        question: buildQuestion(),
        callbacks: buildCallbacks({ onClose, onQuestionUpdated }),
      }),
    );

    await act(async () => {
      await result.current.deleteConfirmation.confirmDelete();
    });

    expect(deleteQuestionSpy).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onQuestionUpdated).toHaveBeenCalledTimes(1);
  });

  it('reports a formatted error message when deletion fails', async () => {
    jest
      .spyOn(apiService, 'deleteQuestion')
      .mockRejectedValue(new Error('network down'));
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useQuestionActions({
        question: buildQuestion(),
        callbacks: buildCallbacks(),
        onError,
      }),
    );

    await act(async () => {
      await result.current.deleteConfirmation.confirmDelete();
    });

    expect(onError).toHaveBeenCalledWith('Delete failed: network down');
  });

  it('refreshes the question and then notifies the parent on handleQuestionUpdated', async () => {
    const refreshed = buildQuestion({ count_practise: 20 });
    jest.spyOn(apiService, 'getQuestion').mockResolvedValue(refreshed);
    const onQuestionRefreshed = jest.fn();
    const onQuestionUpdated = jest.fn();
    const { result } = renderHook(() =>
      useQuestionActions({
        question: buildQuestion(),
        callbacks: buildCallbacks({ onQuestionRefreshed, onQuestionUpdated }),
      }),
    );

    await act(async () => {
      await result.current.handleQuestionUpdated();
    });

    expect(apiService.getQuestion).toHaveBeenCalledWith(1);
    expect(onQuestionRefreshed).toHaveBeenCalledWith(refreshed);
    expect(onQuestionUpdated).toHaveBeenCalledTimes(1);
  });

  it('reports a formatted error when refreshing the question fails', async () => {
    jest
      .spyOn(apiService, 'getQuestion')
      .mockRejectedValue(new Error('network down'));
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useQuestionActions({
        question: buildQuestion(),
        callbacks: buildCallbacks(),
        onError,
      }),
    );

    await act(async () => {
      await result.current.handleQuestionUpdated();
    });

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        'Failed to refresh question: network down',
      ),
    );
  });

  it('handleCopyQuestion does not throw', () => {
    const { result } = renderHook(() =>
      useQuestionActions({
        question: buildQuestion(),
        callbacks: buildCallbacks(),
      }),
    );

    expect(() => result.current.handleCopyQuestion()).not.toThrow();
  });
});

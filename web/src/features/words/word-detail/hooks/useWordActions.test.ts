import { renderHook, act } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { apiService } from '../../../../lib/api';
import { WordActionsCallbacks } from '../types/word-detail';

import { useWordActions } from './useWordActions';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

const buildCallbacks = (
  overrides: Partial<WordActionsCallbacks> = {},
): WordActionsCallbacks => ({
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  ...overrides,
});

describe('useWordActions', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('opens the edit modal and calls onEdit', () => {
    const onEdit = vi.fn();
    const { result } = renderHook(() =>
      useWordActions({
        word: buildWord(),
        callbacks: buildCallbacks({ onEdit }),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleEdit();
    });

    expect(result.current.isEditModalOpen).toBe(true);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('closes the edit modal', () => {
    const { result } = renderHook(() =>
      useWordActions({
        word: buildWord(),
        callbacks: buildCallbacks(),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleEdit();
    });
    act(() => {
      result.current.handleCloseEditModal();
    });

    expect(result.current.isEditModalOpen).toBe(false);
  });

  it('notifies onWordUpdated', () => {
    const onWordUpdated = vi.fn();
    const { result } = renderHook(() =>
      useWordActions({
        word: buildWord(),
        callbacks: buildCallbacks({ onWordUpdated }),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleWordUpdated();
    });

    expect(onWordUpdated).toHaveBeenCalledTimes(1);
  });

  it('opens the delete confirmation and calls onDelete', () => {
    const onDelete = vi.fn();
    const { result } = renderHook(() =>
      useWordActions({
        word: buildWord(),
        callbacks: buildCallbacks({ onDelete }),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleDeleteWord();
    });

    expect(result.current.showDeleteConfirm).toBe(true);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('deletes the word and notifies onClose/onWordUpdated on confirm', async () => {
    const deleteWordSpy = vi
      .spyOn(apiService, 'deleteWord')
      .mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onWordUpdated = vi.fn();
    const { result } = renderHook(() =>
      useWordActions({
        word: buildWord({ id: 7 }),
        callbacks: buildCallbacks({ onWordUpdated }),
        onClose,
      }),
    );

    await act(async () => {
      await result.current.handleDeleteWordConfirm();
    });

    expect(deleteWordSpy).toHaveBeenCalledWith(7);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onWordUpdated).toHaveBeenCalledTimes(1);
  });

  it('reports a formatted error message when deletion fails', async () => {
    vi.spyOn(apiService, 'deleteWord').mockRejectedValue(
      new Error('network down'),
    );
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useWordActions({
        word: buildWord(),
        callbacks: buildCallbacks(),
        onClose: vi.fn(),
        onError,
      }),
    );

    await act(async () => {
      await result.current.handleDeleteWordConfirm();
    });

    expect(onError).toHaveBeenCalledWith('Failed to delete word: network down');
  });

  it('cancels the delete confirmation', () => {
    const { result } = renderHook(() =>
      useWordActions({
        word: buildWord(),
        callbacks: buildCallbacks(),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleDeleteWord();
    });
    act(() => {
      result.current.handleDeleteWordCancel();
    });

    expect(result.current.showDeleteConfirm).toBe(false);
  });
});

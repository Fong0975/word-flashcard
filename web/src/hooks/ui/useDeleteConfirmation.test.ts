import { renderHook, act } from '@testing-library/react';

import { useDeleteConfirmation } from './useDeleteConfirmation';

interface TestEntity {
  id: number;
  name: string;
}

const buildEntity = (): TestEntity => ({ id: 1, name: 'apple' });

describe('useDeleteConfirmation', () => {
  it('builds an empty confirm message when there is no entity', () => {
    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity: null,
        onDelete: jest.fn(),
        getConfirmMessage: entity => `Delete ${entity.name}?`,
      }),
    );

    expect(result.current.confirmMessage).toBe('');
  });

  it('builds the confirm message from the current entity', () => {
    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity: buildEntity(),
        onDelete: jest.fn(),
        getConfirmMessage: entity => `Delete ${entity.name}?`,
      }),
    );

    expect(result.current.confirmMessage).toBe('Delete apple?');
  });

  it('does not open the confirmation dialog when there is no entity', () => {
    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity: null,
        onDelete: jest.fn(),
        getConfirmMessage: () => '',
      }),
    );

    act(() => {
      result.current.showDeleteConfirm();
    });

    expect(result.current.showConfirm).toBe(false);
  });

  it('opens and cancels the confirmation dialog', () => {
    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity: buildEntity(),
        onDelete: jest.fn(),
        getConfirmMessage: () => 'Delete?',
      }),
    );

    act(() => {
      result.current.showDeleteConfirm();
    });
    expect(result.current.showConfirm).toBe(true);

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.showConfirm).toBe(false);
  });

  it('deletes the entity and reports success', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const entity = buildEntity();

    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity,
        onDelete,
        getConfirmMessage: () => 'Delete?',
        onSuccess,
      }),
    );

    act(() => {
      result.current.showDeleteConfirm();
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(onDelete).toHaveBeenCalledWith(entity);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.showConfirm).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it('reports an error and keeps the dialog open when the delete fails', async () => {
    const onDelete = jest.fn().mockRejectedValue(new Error('network down'));
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity: buildEntity(),
        onDelete,
        getConfirmMessage: () => 'Delete?',
        onError,
      }),
    );

    act(() => {
      result.current.showDeleteConfirm();
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'network down' }),
    );
    expect(result.current.showConfirm).toBe(true);
    expect(result.current.isDeleting).toBe(false);
  });

  it('wraps a non-Error rejection in an Error before reporting it', async () => {
    const onDelete = jest.fn().mockRejectedValue('rejected as a string');
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity: buildEntity(),
        onDelete,
        getConfirmMessage: () => 'Delete?',
        onError,
      }),
    );

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Delete failed' }),
    );
  });

  it('does nothing when confirming delete without an entity', async () => {
    const onDelete = jest.fn();

    const { result } = renderHook(() =>
      useDeleteConfirmation<TestEntity>({
        entity: null,
        onDelete,
        getConfirmMessage: () => '',
      }),
    );

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(onDelete).not.toHaveBeenCalled();
  });
});

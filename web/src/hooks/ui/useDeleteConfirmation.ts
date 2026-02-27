/**
 * Hook for managing delete confirmation dialogs
 *
 * This hook provides a standardized way to handle delete confirmations
 * with loading states and error handling.
 */

import { useState } from 'react';

export interface UseDeleteConfirmationOptions<T> {
  readonly entity: T | null;
  readonly onDelete: (entity: T) => Promise<void>;
  readonly getConfirmMessage: (entity: T) => string;
  readonly onSuccess?: () => void;
  readonly onError?: (error: Error) => void;
}

export interface UseDeleteConfirmationReturn {
  readonly showConfirm: boolean;
  readonly isDeleting: boolean;
  readonly confirmMessage: string;
  readonly confirmDelete: () => Promise<void>;
  readonly cancelDelete: () => void;
  readonly showDeleteConfirm: () => void;
}

/**
 * Hook for delete confirmation management
 *
 * @example
 * ```tsx
 * const deleteConfirmation = useDeleteConfirmation({
 *   entity: selectedWord,
 *   onDelete: async (word) => {
 *     await apiService.deleteWord(word.id);
 *   },
 *   getConfirmMessage: (word) => `Are you sure you want to delete "${word.word}"?`,
 *   onSuccess: () => {
 *     onClose();
 *     onWordUpdated?.();
 *   },
 *   onError: (error) => showError(`Delete failed: ${error.message}`)
 * });
 *
 * // In component:
 * <ConfirmationDialog
 *   isOpen={deleteConfirmation.showConfirm}
 *   title="Delete Word"
 *   message={deleteConfirmation.confirmMessage}
 *   confirmText="Delete Word"
 *   variant="danger"
 *   isConfirming={deleteConfirmation.isDeleting}
 *   onConfirm={deleteConfirmation.confirmDelete}
 *   onCancel={deleteConfirmation.cancelDelete}
 * />
 * ```
 */
export const useDeleteConfirmation = <T>({
  entity,
  onDelete,
  getConfirmMessage,
  onSuccess,
  onError,
}: UseDeleteConfirmationOptions<T>): UseDeleteConfirmationReturn => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmMessage = entity ? getConfirmMessage(entity) : '';

  const showDeleteConfirm = () => {
    if (entity) {
      setShowConfirm(true);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!entity) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(entity);
      setShowConfirm(false);
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Delete failed');
      onError?.(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    showConfirm,
    isDeleting,
    confirmMessage,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
  };
};

import { useState, useCallback } from 'react';

/**
 * Modal configuration interface
 */
export interface ModalConfig<T = unknown> {
  isOpen: boolean;
  data?: T;
}

/**
 * Modal manager return type
 */
export interface UseModalManagerReturn<T = unknown> {
  modalState: Record<string, ModalConfig<T>>;
  openModal: (modalName: string, data?: T) => void;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;
  isModalOpen: (modalName: string) => boolean;
  getModalData: <K = T>(modalName: string) => K | undefined;
  setModalData: (modalName: string, data: T) => void;
}

/**
 * Generic hook for managing multiple modals with associated data
 *
 * Provides a unified way to handle modal state management, including:
 * - Opening/closing modals
 * - Associated data management
 * - Bulk operations
 *
 * @example
 * ```tsx
 * const modalManager = useModalManager();
 *
 * // Open a modal with data
 * modalManager.openModal('editWord', selectedWord);
 *
 * // Check if modal is open
 * const isEditOpen = modalManager.isModalOpen('editWord');
 *
 * // Get modal data
 * const editingWord = modalManager.getModalData<Word>('editWord');
 *
 * // Close modal
 * modalManager.closeModal('editWord');
 * ```
 */
export const useModalManager = <T = unknown>(): UseModalManagerReturn<T> => {
  const [modalState, setModalState] = useState<Record<string, ModalConfig<T>>>(
    {},
  );

  const openModal = useCallback((modalName: string, data?: T) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: {
        isOpen: true,
        data,
      },
    }));
  }, []);

  const closeModal = useCallback((modalName: string) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: {
        isOpen: false,
        data: undefined,
      },
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalState(prev => {
      const newState: Record<string, ModalConfig<T>> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = {
          isOpen: false,
          data: undefined,
        };
      });
      return newState;
    });
  }, []);

  const isModalOpen = useCallback(
    (modalName: string): boolean => {
      return modalState[modalName]?.isOpen ?? false;
    },
    [modalState],
  );

  const getModalData = useCallback(
    <K = T>(modalName: string): K | undefined => {
      return modalState[modalName]?.data as K | undefined;
    },
    [modalState],
  );

  const setModalData = useCallback((modalName: string, data: T) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: {
        ...prev[modalName],
        data,
      },
    }));
  }, []);

  return {
    modalState,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData,
    setModalData,
  };
};

/**
 * Predefined modal configurations for common use cases
 */
export const MODAL_NAMES = {
  // Common modals
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  DETAIL: 'detail',

  // Quiz modals
  QUIZ_SETUP: 'quizSetup',
  QUIZ: 'quiz',

  // Word-specific modals
  WORD_DETAIL: 'wordDetail',
  DEFINITION_ADD: 'definitionAdd',
  DEFINITION_EDIT: 'definitionEdit',

  // Question-specific modals
  QUESTION_DETAIL: 'questionDetail',
} as const;

export type ModalName = (typeof MODAL_NAMES)[keyof typeof MODAL_NAMES];

/**
 * Generic detail modal component for displaying entity details
 *
 * This component provides a common pattern for displaying detailed information
 * about entities (words, questions, etc.) with edit, delete, and action capabilities.
 */

import React, { ReactNode, useState } from 'react';

import { Modal, ToastContainer } from '../ui';
import { BaseEntity, BaseModalProps, CardAction } from '../../types';
import { useToast } from '../../hooks/ui/useToast';

export interface DetailModalConfig<TEntity extends BaseEntity> {
  readonly title: (entity: TEntity) => string;
  readonly subtitle?: (entity: TEntity) => ReactNode;
  readonly allowEdit?: boolean;
  readonly allowDelete?: boolean;
  readonly allowCopy?: boolean;
  readonly deleteConfirmMessage?: (entity: TEntity) => string;
}

interface DetailModalProps<TEntity extends BaseEntity> extends BaseModalProps {
  readonly entity: TEntity | null;
  readonly config: DetailModalConfig<TEntity>;
  readonly renderContent: (entity: TEntity) => ReactNode;
  readonly renderActions?: (entity: TEntity) => readonly CardAction<TEntity>[];
  readonly onEdit?: (entity: TEntity) => void;
  readonly onDelete?: (entity: TEntity) => Promise<void>;
  readonly onEntityUpdated?: () => void;
}

/**
 * Generic detail modal component
 *
 * @example
 * ```tsx
 * <DetailModal
 *   entity={selectedWord}
 *   isOpen={isDetailModalOpen}
 *   onClose={handleCloseModal}
 *   config={{
 *     title: (word) => word.word,
 *     subtitle: (word) => `${word.definitions.length} definitions`,
 *     allowEdit: true,
 *     allowDelete: true,
 *     deleteConfirmMessage: (word) => `Delete "${word.word}"?`
 *   }}
 *   renderContent={(word) => (
 *     <div>
 *       {word.definitions.map(def => (
 *         <div key={def.id}>{def.definition}</div>
 *       ))}
 *     </div>
 *   )}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const DetailModal = <TEntity extends BaseEntity>({
  entity,
  isOpen,
  onClose,
  config,
  renderContent,
  renderActions,
  onEdit,
  onDelete,
  onEntityUpdated,
  title: modalTitle,
  ...modalProps
}: DetailModalProps<TEntity>) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { toasts, showError, removeToast } = useToast();

  if (!entity) {
    return null;
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(entity);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(entity);
      setShowDeleteConfirm(false);
      onClose();
      if (onEntityUpdated) {
        onEntityUpdated();
      }
    } catch (error) {
      showError('Failed to delete item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleCopy = async () => {
    try {
      const textContent = config.title(entity);
      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      showError('Failed to copy text. Please try again.');
    }
  };

  const title = modalTitle || config.title(entity);
  const subtitle = config.subtitle?.(entity);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size='lg'
        {...modalProps}
      >
        <div className='space-y-4'>
          {/* Subtitle */}
          {subtitle && (
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              {subtitle}
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end space-x-2 border-b border-gray-200 pb-4 dark:border-gray-700'>
            {config.allowCopy && (
              <button
                onClick={handleCopy}
                className='flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                <svg
                  className='mr-2 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            )}

            {config.allowEdit && (
              <button
                onClick={handleEdit}
                className='flex items-center rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600'
              >
                <svg
                  className='mr-2 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                Edit
              </button>
            )}

            {config.allowDelete && (
              <button
                onClick={handleDeleteClick}
                className='flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600'
              >
                <svg
                  className='mr-2 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
                Delete
              </button>
            )}

            {/* Custom Actions */}
            {renderActions?.(entity).map((action, index) => (
              <button
                key={action.id || index}
                onClick={() => action.onClick(entity)}
                disabled={
                  typeof action.disabled === 'function'
                    ? action.disabled(entity)
                    : action.disabled
                }
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  action.variant === 'danger'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                } ${
                  (
                    typeof action.disabled === 'function'
                      ? action.disabled(entity)
                      : action.disabled
                  )
                    ? 'cursor-not-allowed opacity-50'
                    : ''
                } `}
              >
                {action.icon && (
                  <span className='mr-2 h-4 w-4'>{action.icon}</span>
                )}
                {action.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className='space-y-4'>{renderContent(entity)}</div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={handleDeleteCancel}
          title='Confirm Delete'
          maxWidth='sm'
        >
          <div className='space-y-4'>
            <div className='flex items-center'>
              <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
                <svg
                  className='h-6 w-6 text-red-600 dark:text-red-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='ml-4'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                  Delete Confirmation
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {config.deleteConfirmMessage?.(entity) ||
                    'Are you sure you want to delete this item? This action cannot be undone.'}
                </p>
              </div>
            </div>

            <div className='flex justify-end space-x-3'>
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className='flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50'
              >
                {isDeleting && (
                  <svg
                    className='-ml-1 mr-2 h-4 w-4 animate-spin text-white'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

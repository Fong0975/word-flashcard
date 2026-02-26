/**
 * Generic form modal component for creating/editing entities
 *
 * This component provides a common pattern for form modals with create/edit modes,
 * loading states, error handling, and standardized layouts.
 */

import React, { ReactNode } from 'react';

import { Modal } from '../ui/Modal';
import { BaseEntity, BaseModalProps } from '../../types';

export interface FormModalConfig {
  readonly title: {
    create: string;
    edit: string;
  };
  readonly submitButton: {
    create: string;
    edit: string;
    creating: string;
    updating: string;
  };
  readonly maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  readonly disableBackdropClose?: boolean;
}

interface FormModalProps<TEntity extends BaseEntity> extends BaseModalProps {
  readonly entity?: TEntity | null; // The entity being edited (required for edit mode)
  readonly mode: 'create' | 'edit';
  readonly config: FormModalConfig;
  readonly loading: boolean;
  readonly error: string | null;
  readonly renderForm: () => ReactNode;
  readonly onSubmit: (e: React.FormEvent) => Promise<void> | void;
  readonly onEntitySaved?: (entity?: TEntity) => void;
  readonly isSubmitDisabled?: boolean;
}

/**
 * Generic form modal component
 *
 * @example
 * ```tsx
 * <FormModal
 *   entity={selectedWord}
 *   mode="edit"
 *   isOpen={isFormModalOpen}
 *   onClose={handleCloseModal}
 *   config={{
 *     title: {
 *       create: 'Add New Word',
 *       edit: 'Edit Word'
 *     },
 *     submitButton: {
 *       create: 'Add Word',
 *       edit: 'Update Word',
 *       creating: 'Adding...',
 *       updating: 'Updating...'
 *     },
 *     maxWidth: 'md'
 *   }}
 *   loading={loading}
 *   error={error}
 *   onSubmit={handleSubmit}
 *   isSubmitDisabled={!formData.word?.trim()}
 *   renderForm={() => (
 *     <div className="space-y-4">
 *       <div>
 *         <label htmlFor="word" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
 *           Word
 *         </label>
 *         <input
 *           type="text"
 *           id="word"
 *           value={formData.word}
 *           onChange={handleFieldChange('word')}
 *           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm..."
 *         />
 *       </div>
 *     </div>
 *   )}
 * />
 * ```
 */
export const FormModal = <TEntity extends BaseEntity>({
  entity,
  mode,
  isOpen,
  onClose,
  config,
  loading,
  error,
  renderForm,
  onSubmit,
  isSubmitDisabled = false,
  title: modalTitle,
  ...modalProps
}: FormModalProps<TEntity>) => {
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const title = modalTitle || config.title[mode];
  const submitButtonText = loading
    ? config.submitButton[mode === 'create' ? 'creating' : 'updating']
    : config.submitButton[mode];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth={config.maxWidth || 'md'}
      disableBackdropClose={config.disableBackdropClose}
      {...modalProps}
    >
      <form onSubmit={onSubmit}>
        <div className="space-y-6">
          {/* Form Content */}
          {renderForm()}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitDisabled}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600
                         rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {submitButtonText}
                </div>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
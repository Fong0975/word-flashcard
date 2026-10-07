import React from 'react';

import { ConfirmationDialog } from './ConfirmationDialog';

interface UnsavedChangesDialogProps {
  readonly isOpen: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Confirmation shown before leaving a page that has unsaved edits.
 *
 * @param props.isOpen - Whether the dialog is visible
 * @param props.onConfirm - Called when the user chooses to discard the edits and leave
 * @param props.onCancel - Called when the user chooses to stay and keep editing
 */
export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => (
  <ConfirmationDialog
    isOpen={isOpen}
    title='Discard changes?'
    message='You have unsaved changes. If you leave now, they will be lost.'
    confirmText='Discard changes'
    cancelText='Keep editing'
    variant='warning'
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

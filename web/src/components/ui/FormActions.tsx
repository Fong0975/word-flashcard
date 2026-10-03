import React from 'react';

interface FormActionsProps {
  mode: 'create' | 'edit';
  entityLabel: string;
  isSubmitting: boolean;
  isFormValid: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  mode,
  entityLabel,
  isSubmitting,
  isFormValid,
  onCancel,
  onSubmit,
  className = 'flex justify-end space-x-3 pt-4',
}) => {
  const submitButtonText =
    mode === 'create' ? `Add ${entityLabel}` : `Update ${entityLabel}`;
  const submitButtonLoadingText =
    mode === 'create' ? 'Adding...' : 'Updating...';

  return (
    <div className={className}>
      <button
        type='button'
        onClick={onCancel}
        disabled={isSubmitting}
        className='glass-interactive glass-border-subtle rounded-md px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300'
      >
        Cancel
      </button>
      <button
        type='button'
        onClick={onSubmit}
        disabled={isSubmitting || !isFormValid}
        className='glass-button-primary rounded-md px-4 py-2 text-sm font-medium'
      >
        {isSubmitting ? (
          <div className='flex items-center'>
            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
            {submitButtonLoadingText}
          </div>
        ) : (
          submitButtonText
        )}
      </button>
    </div>
  );
};

import React from 'react';

interface FormActionsProps {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  isFormValid: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  mode,
  isSubmitting,
  isFormValid,
  onCancel,
  onSubmit,
}) => {
  const submitButtonText =
    mode === 'create' ? 'Add Question' : 'Update Question';
  const submitButtonLoadingText =
    mode === 'create' ? 'Adding...' : 'Updating...';

  return (
    <div className='flex justify-end space-x-3 pb-2 pt-4'>
      <button
        type='button'
        onClick={onCancel}
        disabled={isSubmitting}
        className='rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      >
        Cancel
      </button>
      <button
        type='button'
        onClick={onSubmit}
        disabled={isSubmitting || !isFormValid}
        className='rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
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

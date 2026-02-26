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
  const submitButtonText = mode === 'create' ? 'Add Question' : 'Update Question';
  const submitButtonLoadingText = mode === 'create' ? 'Adding...' : 'Updating...';

  return (
    <div className="flex justify-end space-x-3 pt-4 pb-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                   hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !isFormValid}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600
                   rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {submitButtonLoadingText}
          </div>
        ) : (
          submitButtonText
        )}
      </button>
    </div>
  );
};
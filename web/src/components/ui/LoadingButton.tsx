/**
 * Reusable loading button component with standardized loading states
 *
 * This component provides a consistent loading button pattern
 * with spinner animation and disabled state management.
 */

import React, { ReactNode } from 'react';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly isLoading: boolean;
  readonly loadingText?: string;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly fullWidth?: boolean;
  readonly icon?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Loading button component with standardized styles and loading states
 *
 * @example
 * ```tsx
 * // Primary button with loading
 * <LoadingButton
 *   isLoading={isSubmitting}
 *   loadingText="Saving..."
 *   variant="primary"
 *   onClick={handleSubmit}
 * >
 *   Save Changes
 * </LoadingButton>
 *
 * // Danger button with custom icon
 * <LoadingButton
 *   isLoading={isDeleting}
 *   loadingText="Deleting..."
 *   variant="danger"
 *   size="sm"
 *   icon={<TrashIcon className="w-4 h-4" />}
 *   onClick={handleDelete}
 * >
 *   Delete
 * </LoadingButton>
 * ```
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    switch (variant) {
      case 'secondary':
        return `${baseClasses} text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-blue-500`;
      case 'danger':
        return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      case 'ghost':
        return `${baseClasses} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-blue-500`;
      default: // primary
        return `${baseClasses} text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500`;
    }
  };

  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${className}
        flex items-center justify-center
      `.trim()}
    >
      {isLoading ? (
        <>
          <svg
            className={`animate-spin -ml-1 mr-2 ${getSpinnerSize()} text-current`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
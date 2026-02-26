/**
 * Reusable copy button component with integrated copy to clipboard functionality
 *
 * This component provides a standardized copy button with visual feedback
 * and automatic state management.
 */

import React from 'react';

import { useCopyToClipboard } from '../../hooks/ui/useCopyToClipboard';

export interface CopyButtonProps {
  readonly text: string;
  readonly className?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'default' | 'ghost' | 'outline';
  readonly title?: string;
  readonly successText?: string;
  readonly errorText?: string;
  readonly disabled?: boolean;
  readonly onCopySuccess?: () => void;
  readonly onCopyError?: (error: string) => void;
}

/**
 * Copy button component with automatic state management
 *
 * @example
 * ```tsx
 * // Simple usage
 * <CopyButton text="Text to copy" />
 *
 * // With custom styling and callbacks
 * <CopyButton
 *   text={word.word}
 *   size="sm"
 *   variant="ghost"
 *   title="Copy word to clipboard"
 *   successText="Word copied!"
 *   className="ml-2"
 *   onCopySuccess={() => console.log('Copied!')}
 * />
 * ```
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = '',
  size = 'md',
  variant = 'default',
  title,
  successText = 'Copied!',
  errorText = 'Copy failed',
  disabled = false,
  onCopySuccess,
  onCopyError,
}) => {
  const { copySuccess, copyError, copyToClipboard } = useCopyToClipboard();

  const handleCopy = async () => {
    if (disabled || !text) {return;}

    await copyToClipboard(text);

    if (copySuccess) {
      onCopySuccess?.();
    } else if (copyError) {
      onCopyError?.(copyError);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-1';
      case 'lg':
        return 'p-3';
      default:
        return 'p-2';
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md';

    switch (variant) {
      case 'ghost':
        return `${baseClasses} text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200`;
      case 'outline':
        return `${baseClasses} text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600`;
      default:
        return `${baseClasses} text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 ${
          copySuccess ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : ''
        }`;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  const buttonTitle = title || (copySuccess ? successText : (copyError ? errorText : 'Copy to clipboard'));

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !text}
      className={`${getSizeClasses()} ${getVariantClasses()} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={buttonTitle}
      aria-label={buttonTitle}
    >
      {copySuccess ? (
        <svg
          className={`${getIconSize()} text-green-600 dark:text-green-400`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : copyError ? (
        <svg
          className={`${getIconSize()} text-red-500 dark:text-red-400`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ) : (
        <svg
          className={getIconSize()}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  );
};
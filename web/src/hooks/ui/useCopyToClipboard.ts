/**
 * Hook for managing copy to clipboard functionality
 *
 * This hook provides a standardized way to handle clipboard operations
 * with feedback states and fallback support.
 */

import { useState, useCallback } from 'react';

export interface UseCopyToClipboardOptions {
  readonly autoResetDelay?: number;
  readonly onError?: (error: Error, errorMessage: string) => void;
}

export interface UseCopyToClipboardReturn {
  readonly copySuccess: boolean;
  readonly copyError: string | null;
  readonly isSupported: boolean;
  readonly copyToClipboard: (text: string) => Promise<void>;
  readonly resetState: () => void;
}

/**
 * Hook for copy to clipboard functionality
 *
 * @example
 * ```tsx
 * const { copySuccess, copyError, copyToClipboard } = useCopyToClipboard();
 *
 * const handleCopy = async () => {
 *   await copyToClipboard('Text to copy');
 * };
 *
 * return (
 *   <button
 *     onClick={handleCopy}
 *     className={copySuccess ? 'text-green-600' : 'text-gray-600'}
 *   >
 *     {copySuccess ? 'Copied!' : 'Copy'}
 *   </button>
 * );
 * ```
 */
export const useCopyToClipboard = (
  options: UseCopyToClipboardOptions = {},
): UseCopyToClipboardReturn => {
  const { autoResetDelay = 2000, onError } = options;
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Check if clipboard API is supported
  const isSupported = !!(navigator.clipboard && navigator.clipboard.writeText);

  const resetState = useCallback(() => {
    setCopySuccess(false);
    setCopyError(null);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string): Promise<void> => {
      if (!text) {
        setCopyError('No text provided to copy');
        return;
      }

      // Reset previous state
      resetState();

      try {
        if (isSupported) {
          // Use modern Clipboard API
          await navigator.clipboard.writeText(text);
          setCopySuccess(true);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (successful) {
            setCopySuccess(true);
          } else {
            throw new Error('Copy command failed');
          }
        }

        // Auto-reset success state after delay
        if (autoResetDelay > 0) {
          setTimeout(() => {
            setCopySuccess(false);
          }, autoResetDelay);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to copy to clipboard';
        const errorObj =
          error instanceof Error ? error : new Error(errorMessage);

        setCopyError(errorMessage);

        // Call error handler if provided
        if (onError) {
          onError(errorObj, errorMessage);
        }

        // Auto-reset error state after delay
        if (autoResetDelay > 0) {
          setTimeout(() => {
            setCopyError(null);
          }, autoResetDelay);
        }
      }
    },
    [isSupported, autoResetDelay, resetState, onError],
  );

  return {
    copySuccess,
    copyError,
    isSupported,
    copyToClipboard,
    resetState,
  };
};

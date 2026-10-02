/**
 * Reusable copy button component with integrated copy to clipboard functionality
 *
 * This component provides the single, standardized copy button used across the
 * app, with visual feedback and automatic state management.
 */

import React from 'react';

import { useCopyToClipboard } from '../../hooks/ui/useCopyToClipboard';
import { useToast } from '../../hooks/ui/useToast';

import { ToastContainer } from './Toast';

export interface CopyButtonProps {
  readonly text: string;
  readonly className?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly title?: string;
  readonly successText?: string;
  readonly errorText?: string;
  readonly disabled?: boolean;
}

const SIZE_CLASSES = { sm: 'p-1', md: 'p-2', lg: 'p-3' } as const;
const ICON_SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const;

/** How long the success/error icon stays before reverting, in milliseconds. */
export const COPY_FEEDBACK_DURATION_MS = 1000;

const BASE_CLASSES =
  'rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
const IDLE_CLASSES =
  'text-gray-600 dark:text-gray-400 enabled:hover:text-primary-600 dark:enabled:hover:text-primary-400 enabled:hover:bg-primary-50 dark:enabled:hover:bg-primary-900/20';
const SUCCESS_CLASSES =
  'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20';

/**
 * Copy button component with automatic state management.
 *
 * On success the icon briefly switches to a checkmark while the blue tint is
 * kept; on failure it briefly shows a warning icon and an error toast is
 * rendered at the bottom-right of the viewport (the toast container portals
 * to `document.body`, so it is never clipped by a surrounding modal). The
 * button is disabled when `text` is empty.
 *
 * @param text - The text copied to the clipboard on click.
 * @param className - Extra classes appended to the button (e.g. margins).
 * @param size - Button/icon size, defaults to `md`.
 * @param title - Tooltip and accessible label; derived from state when omitted.
 * @param successText - Label shown after a successful copy.
 * @param errorText - Label shown after a failed copy.
 * @param disabled - Forces the button into the disabled state.
 *
 * @example
 * ```tsx
 * <CopyButton text={word.word} title='Copy word to clipboard' />
 * ```
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = '',
  size = 'md',
  title,
  successText = 'Copied!',
  errorText = 'Copy failed',
  disabled = false,
}) => {
  const { toasts, showError, removeToast } = useToast();
  const { copySuccess, copyError, copyToClipboard } = useCopyToClipboard({
    autoResetDelay: COPY_FEEDBACK_DURATION_MS,
    onError: (_error, message) => showError(message),
  });

  const isDisabled = disabled || !text;
  const iconClass = ICON_SIZE_CLASSES[size];

  const handleCopy = async () => {
    if (isDisabled) {
      return;
    }
    await copyToClipboard(text);
  };

  const buttonTitle =
    title ||
    (copySuccess ? successText : copyError ? errorText : 'Copy to clipboard');

  return (
    <>
      <button
        type='button'
        onClick={handleCopy}
        disabled={isDisabled}
        className={`${SIZE_CLASSES[size]} ${BASE_CLASSES} ${
          copySuccess ? SUCCESS_CLASSES : IDLE_CLASSES
        } ${className} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
        title={buttonTitle}
        aria-label={buttonTitle}
      >
        {copySuccess ? (
          <svg
            className={iconClass}
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        ) : copyError ? (
          <svg
            className={`${iconClass} text-error`}
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
            />
          </svg>
        ) : (
          <svg
            className={iconClass}
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='2'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184'
            />
          </svg>
        )}
      </button>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

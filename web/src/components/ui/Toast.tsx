/**
 * Toast notification component for displaying temporary messages
 *
 * Displays toast messages in the bottom-right corner of the screen with auto-dismiss
 * and manual close functionality. `ToastContainer` portals into `document.body` so it
 * always renders relative to the viewport, even when mounted inside a Modal whose
 * content box establishes its own containing block via a CSS `transform`.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ToastProps {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'error' | 'warning' | 'info';
  readonly duration?: number; // in milliseconds, default 4000
  readonly onClose: (id: string) => void;
}

interface ToastTypeStyle {
  /** Tinted circle behind the icon. */
  readonly chip: string;
  /** Icon stroke color. */
  readonly icon: string;
  /** Countdown line along the bottom edge. */
  readonly progress: string;
  /** SVG path of the status icon (24x24 outline). */
  readonly iconPath: string;
}

/**
 * The toast surface itself is neutral glass; status is carried only by the
 * icon chip and the progress line. Each status has its own icon shape so it
 * never depends on color alone.
 */
const TOAST_TYPE_STYLES: Record<ToastProps['type'], ToastTypeStyle> = {
  success: {
    chip: 'bg-green-100 dark:bg-green-900/50',
    icon: 'text-green-600 dark:text-green-400',
    progress: 'bg-green-400 dark:bg-green-500',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    chip: 'bg-red-100 dark:bg-red-900/50',
    icon: 'text-error',
    progress: 'bg-red-400 dark:bg-red-500',
    iconPath:
      'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    chip: 'bg-yellow-100 dark:bg-yellow-900/50',
    icon: 'text-yellow-700 dark:text-yellow-400',
    progress: 'bg-yellow-400 dark:bg-yellow-500',
    iconPath:
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  },
  info: {
    chip: 'bg-blue-100 dark:bg-blue-900/50',
    icon: 'text-blue-600 dark:text-blue-400',
    progress: 'bg-blue-400 dark:bg-blue-500',
    iconPath:
      'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const styles = TOAST_TYPE_STYLES[type];

  return (
    <div
      className='glass-panel-dropdown focus-ring animate-slide-in-right relative mb-4 flex min-h-16 w-full cursor-pointer flex-col justify-center overflow-hidden rounded-lg p-3 sm:w-96 md:p-4'
      role='alert'
      onClick={() => onClose(id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose(id);
        }
      }}
      tabIndex={0}
      aria-label={`${type} notification: ${message}. Click to dismiss.`}
    >
      <div className='flex items-center'>
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${styles.chip} ${styles.icon}`}
          data-testid='toast-icon-chip'
        >
          <svg
            className='h-5 w-5'
            fill='none'
            strokeWidth='2'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d={styles.iconPath}
            />
          </svg>
        </div>
        <div className='ml-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
          {message}
        </div>
      </div>
      <div
        className={`animate-toast-progress absolute bottom-0 left-0 h-0.5 w-full ${styles.progress}`}
        style={{ animationDuration: `${duration}ms` }}
        data-testid='toast-progress-bar'
      />
    </div>
  );
};

/**
 * Toast message data structure
 */
export interface ToastMessage {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'error' | 'warning' | 'info';
  readonly duration?: number;
}

/**
 * Toast container component for managing multiple toasts
 */
export interface ToastContainerProps {
  readonly toasts: readonly ToastMessage[];
  readonly onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast,
}) => {
  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className='fixed bottom-4 left-8 right-8 z-50 space-y-4 sm:left-auto'
      aria-live='polite'
      aria-label='Notifications'
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={onRemoveToast}
        />
      ))}
    </div>,
    document.body,
  );
};

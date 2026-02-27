/**
 * Toast notification hook for managing toast messages
 *
 * Provides methods to show different types of toast messages and automatically
 * manages their lifecycle.
 */

import { useState, useCallback } from 'react';

import type { ToastMessage } from '../../components/ui';

export interface UseToastReturn {
  readonly toasts: readonly ToastMessage[];
  readonly showToast: (
    message: string,
    type: ToastMessage['type'],
    duration?: number,
  ) => void;
  readonly showSuccess: (message: string, duration?: number) => void;
  readonly showError: (message: string, duration?: number) => void;
  readonly showWarning: (message: string, duration?: number) => void;
  readonly showInfo: (message: string, duration?: number) => void;
  readonly removeToast: (id: string) => void;
  readonly clearAllToasts: () => void;
}

/**
 * Hook for managing toast notifications
 */
export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastMessage['type'], duration = 4000) => {
      const newToast: ToastMessage = {
        id: generateId(),
        message,
        type,
        duration,
      };

      setToasts(prevToasts => [...prevToasts, newToast]);
    },
    [generateId],
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast],
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
  };
};

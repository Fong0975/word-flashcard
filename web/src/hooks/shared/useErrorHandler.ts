import { useState, useCallback } from 'react';

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Error information interface
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: Error;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  defaultRetryable?: boolean;
  logErrors?: boolean;
  autoClears?: { [key in ErrorType]?: number }; // Auto clear timeouts in ms
}

/**
 * Error handler return type
 */
export interface UseErrorHandlerReturn {
  error: ErrorInfo | null;
  hasError: boolean;
  setError: (error: Error | string | null, type?: ErrorType) => void;
  clearError: () => void;
  retryLastAction: (() => void) | null;
  setRetryAction: (action: (() => void) | null) => void;
  handleAsync: <T>(
    asyncFn: () => Promise<T>,
    errorType?: ErrorType,
  ) => Promise<T | null>;
}

/**
 * Extract error type from error object
 */
const getErrorType = (error: Error): ErrorType => {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK;
  }

  if (message.includes('permission') || message.includes('unauthorized')) {
    return ErrorType.PERMISSION;
  }

  if (message.includes('not found') || message.includes('404')) {
    return ErrorType.NOT_FOUND;
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }

  if (message.includes('server') || message.includes('500')) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Determine if error type is retryable by default
 */
const isRetryable = (type: ErrorType): boolean => {
  switch (type) {
    case ErrorType.NETWORK:
    case ErrorType.SERVER:
      return true;
    case ErrorType.VALIDATION:
    case ErrorType.PERMISSION:
    case ErrorType.NOT_FOUND:
      return false;
    default:
      return false;
  }
};

/**
 * Generic hook for unified error handling across components
 *
 * Provides consistent error management including:
 * - Error categorization and classification
 * - Retry mechanism for recoverable errors
 * - Auto-clear functionality for specific error types
 * - Async operation wrapper with error handling
 *
 * @example
 * ```tsx
 * const errorHandler = useErrorHandler({
 *   logErrors: true,
 *   autoClears: { [ErrorType.VALIDATION]: 5000 }
 * });
 *
 * // Handle async operation
 * const result = await errorHandler.handleAsync(async () => {
 *   return apiService.fetchData();
 * }, ErrorType.NETWORK);
 *
 * // Manual error setting
 * errorHandler.setError(new Error('Custom error'), ErrorType.VALIDATION);
 *
 * // Setup retry action
 * errorHandler.setRetryAction(() => fetchData());
 * ```
 */
export const useErrorHandler = (
  config: ErrorHandlerConfig = {},
): UseErrorHandlerReturn => {
  const {
    defaultRetryable = false,
    logErrors = false,
    autoClears = {},
  } = config;

  const [error, setErrorState] = useState<ErrorInfo | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const setError = useCallback(
    (error: Error | string | null, type?: ErrorType) => {
      if (error === null) {
        setErrorState(null);
        setRetryAction(null);
        return;
      }

      const errorObj = typeof error === 'string' ? new Error(error) : error;
      const errorType = type || getErrorType(errorObj);
      const retryable = defaultRetryable || isRetryable(errorType);

      const errorInfo: ErrorInfo = {
        type: errorType,
        message: errorObj.message,
        details: errorObj,
        timestamp: new Date(),
        retryable,
      };

      setErrorState(errorInfo);

      // Log error if configured
      if (logErrors) {
        // eslint-disable-next-line no-console
        console.error(`[${errorType.toUpperCase()}]`, errorObj);
      }

      // Setup auto clear if configured
      const autoClearTime = autoClears[errorType];
      if (autoClearTime) {
        setTimeout(() => {
          setErrorState(current => {
            // Only clear if this is still the current error
            return current?.timestamp === errorInfo.timestamp ? null : current;
          });
        }, autoClearTime);
      }
    },
    [defaultRetryable, logErrors, autoClears],
  );

  const clearError = useCallback(() => {
    setErrorState(null);
    setRetryAction(null);
  }, []);

  const retryLastAction = retryAction;

  const setRetryActionCallback = useCallback((action: (() => void) | null) => {
    setRetryAction(() => action);
  }, []);

  const handleAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      errorType?: ErrorType,
    ): Promise<T | null> => {
      try {
        clearError();
        return await asyncFn();
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        setError(errorObj, errorType);
        return null;
      }
    },
    [setError, clearError],
  );

  return {
    error,
    hasError: error !== null,
    setError,
    clearError,
    retryLastAction,
    setRetryAction: setRetryActionCallback,
    handleAsync,
  };
};

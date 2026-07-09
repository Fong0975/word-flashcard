import { ApiErrorCode } from '../types/base';

import { ApiError } from './api';

// Distinguishes a failed connection to the backend (network failure or timeout,
// where `ApiError.status` is 0 because no response was ever received) from an
// error the backend actually returned, so the two cases can show the user
// different, more actionable messages instead of one generic string.
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = 'An unexpected error occurred.',
): string => {
  // eslint-disable-next-line no-console
  console.error(error);

  if (error instanceof ApiError && error.status === 0) {
    return 'Unable to connect to the server. Please check your network connection and try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

// Returns the backend-classified error category (see `models.ErrorCode` on the
// API side), or undefined for network failures (status 0) and non-ApiError
// values. Lets callers branch on failure type (e.g. show a distinct state for
// `upstream_unavailable` dictionary lookups) without string-matching messages.
export const getApiErrorCode = (error: unknown): ApiErrorCode | undefined => {
  if (error instanceof ApiError && error.status !== 0) {
    return error.code;
  }

  return undefined;
};

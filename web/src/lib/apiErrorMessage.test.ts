import { getApiErrorMessage, getApiErrorCode } from './apiErrorMessage';
import { ApiError } from './api';

describe('apiErrorMessage', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getApiErrorMessage', () => {
    it('returns a connectivity message for a status-0 ApiError', () => {
      const error = new ApiError(0, 'Network Error', 'Failed to fetch');
      expect(getApiErrorMessage(error)).toBe(
        'Unable to connect to the server. Please check your network connection and try again.',
      );
    });

    it('returns the error message for an ApiError with a real HTTP status', () => {
      const error = new ApiError(404, 'Not Found', 'Word not found');
      expect(getApiErrorMessage(error)).toBe('Word not found');
    });

    it('returns the message for a plain Error', () => {
      expect(getApiErrorMessage(new Error('Something broke'))).toBe(
        'Something broke',
      );
    });

    it('returns the fallback message for a non-Error value', () => {
      expect(getApiErrorMessage('oops', 'Default failure')).toBe(
        'Default failure',
      );
    });

    it('uses the default fallback message when none is provided', () => {
      expect(getApiErrorMessage('oops')).toBe('An unexpected error occurred.');
    });

    it('logs the error for diagnostics', () => {
      const error = new Error('Something broke');
      getApiErrorMessage(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('getApiErrorCode', () => {
    it('returns the backend error code for an ApiError with a real HTTP status', () => {
      const error = new ApiError(
        400,
        'Bad Request',
        'Invalid word',
        undefined,
        'validation_error',
      );
      expect(getApiErrorCode(error)).toBe('validation_error');
    });

    it('returns undefined for a status-0 ApiError (network failure)', () => {
      const error = new ApiError(0, 'Network Error', 'Failed to fetch');
      expect(getApiErrorCode(error)).toBeUndefined();
    });

    it('returns undefined for a non-ApiError value', () => {
      expect(getApiErrorCode(new Error('Something broke'))).toBeUndefined();
    });
  });
});

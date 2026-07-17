import { apiService, ApiError } from './api';
import { API_CONFIG, API_ENDPOINTS, DICTIONARY_ENDPOINTS } from './api-config';
import { buildMockResponse } from './apiTestHelpers';

describe('ApiService', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('successful requests', () => {
    it('sends a GET request to the base URL for getInformation', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ version: '1.0.0' }));

      const result = await apiService.getInformation();

      expect(result).toEqual({ version: '1.0.0' });
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.information}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('returns an empty object when the response has no JSON content type', async () => {
      fetchMock.mockResolvedValueOnce(
        buildMockResponse('ignored', { contentType: null }),
      );

      const result = await apiService.getInformation();

      expect(result).toEqual({});
    });
  });

  describe('error handling', () => {
    it('throws an ApiError built from the JSON error body on a non-ok response', async () => {
      fetchMock.mockResolvedValueOnce(
        buildMockResponse(
          { error: 'Word not found', code: 'not_found' },
          { ok: false, status: 404, statusText: 'Not Found' },
        ),
      );

      await expect(apiService.getInformation()).rejects.toMatchObject({
        status: 404,
        statusText: 'Not Found',
        message: 'Word not found',
        code: 'not_found',
      });
    });

    it('falls back to the status text when the error response has no JSON body', async () => {
      const response = buildMockResponse(undefined, {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      (response.json as jest.Mock).mockRejectedValue(new Error('not json'));
      fetchMock.mockResolvedValueOnce(response);

      await expect(apiService.getInformation()).rejects.toMatchObject({
        status: 500,
        message: 'Internal Server Error',
      });
    });

    it('wraps a network failure in an ApiError with status 0', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiService.getInformation()).rejects.toMatchObject({
        status: 0,
        statusText: 'Network Error',
        message: 'Failed to fetch',
      });
    });

    it('reports a timeout as an ApiError when the request is aborted', async () => {
      fetchMock.mockRejectedValueOnce(
        new DOMException('The operation was aborted', 'AbortError'),
      );

      await expect(apiService.getInformation()).rejects.toMatchObject({
        status: 0,
        statusText: 'Request Timeout',
        message: 'Request timed out',
      });
    });

    it('rejects with instances of ApiError', async () => {
      fetchMock.mockRejectedValueOnce(new Error('boom'));

      await expect(apiService.getInformation()).rejects.toBeInstanceOf(
        ApiError,
      );
    });
  });

  describe('dictionary lookup', () => {
    it('hits the dictionary base URL for lookupWord', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ word: 'apple' }));

      await apiService.lookupWord('apple');

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_CONFIG.dictionaryBaseURL}${DICTIONARY_ENDPOINTS.lookup('apple')}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('URL-encodes words containing spaces and special characters', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({}));

      await apiService.lookupWord("don't stop");

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${API_CONFIG.dictionaryBaseURL}${DICTIONARY_ENDPOINTS.lookup("don't stop")}`,
      );
      expect(url).toContain(encodeURIComponent("don't stop"));
    });
  });
});

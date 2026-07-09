import { FamiliarityLevel, SearchOperation, SearchLogic } from '../types/base';
import { CreateWordRequest, UpdateWordRequest } from '../types/api';

import { apiService, ApiError } from './api';
import { API_CONFIG, API_ENDPOINTS, DICTIONARY_ENDPOINTS } from './api-config';

type MockResponseOptions = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  contentType?: string | null;
};

const buildMockResponse = (
  body: unknown,
  {
    ok = true,
    status = 200,
    statusText = 'OK',
    contentType = 'application/json',
  }: MockResponseOptions = {},
): Response => {
  return {
    ok,
    status,
    statusText,
    headers: { get: () => contentType },
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
};

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

    it('builds a query string from provided list params and sends the search filter as the body', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));

      const searchFilter = {
        conditions: [
          { key: 'word', operator: SearchOperation.LIKE, value: '%app%' },
        ],
        logic: SearchLogic.OR,
      };

      await apiService.searchWords({
        limit: 10,
        offset: 5,
        sort: 'word',
        searchFilter,
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.wordsSearch}?limit=10&offset=5&sort=word`,
      );
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(searchFilter);
    });

    it('sends an empty object as the body when no search filter is provided', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));

      await apiService.searchWords();

      const [, options] = fetchMock.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({});
    });

    it('serializes the payload and hits the words endpoint for createWord', async () => {
      const created = { id: 1, word: 'apple' };
      fetchMock.mockResolvedValueOnce(buildMockResponse(created));

      const payload: CreateWordRequest = {
        word: 'apple',
        familiarity: FamiliarityLevel.RED,
      };
      const result = await apiService.createWord(payload);

      expect(result).toEqual(created);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.words}`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(payload);
    });

    it('sends a PUT request with the word id in the URL for updateWordFields', async () => {
      const updated = { id: 42, word: 'apple' };
      fetchMock.mockResolvedValueOnce(buildMockResponse(updated));

      const payload: UpdateWordRequest = {
        word: 'apple',
        familiarity: FamiliarityLevel.GREEN,
      };
      await apiService.updateWordFields(42, payload);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.words}/42`);
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual(payload);
    });

    it('sends a DELETE request and resolves without a value', async () => {
      fetchMock.mockResolvedValueOnce(
        buildMockResponse(undefined, { contentType: null }),
      );

      await expect(apiService.deleteWord(7)).resolves.toBeUndefined();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.words}/7`);
      expect(options.method).toBe('DELETE');
    });

    it('returns an empty object when the response has no JSON content type', async () => {
      fetchMock.mockResolvedValueOnce(
        buildMockResponse('ignored', { contentType: null }),
      );

      const result = await apiService.getInformation();

      expect(result).toEqual({});
    });

    it('hits the dictionary base URL for lookupWord', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ word: 'apple' }));

      await apiService.lookupWord('apple');

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_CONFIG.dictionaryBaseURL}${DICTIONARY_ENDPOINTS.lookup('apple')}`,
        expect.objectContaining({ method: 'GET' }),
      );
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
});

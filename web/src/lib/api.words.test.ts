import { FamiliarityLevel, SearchOperation, SearchLogic } from '../types/base';
import { CreateWordRequest, UpdateWordRequest } from '../types/api';

import { apiService } from './api';
import { API_CONFIG, API_ENDPOINTS } from './api-config';
import { buildMockResponse } from './apiTestHelpers';

describe('ApiService - words', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('searchWords', () => {
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

  it('sends a DELETE request and resolves without a value for deleteWord', async () => {
    fetchMock.mockResolvedValueOnce(
      buildMockResponse(undefined, { contentType: null }),
    );

    await expect(apiService.deleteWord(7)).resolves.toBeUndefined();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.words}/7`);
    expect(options.method).toBe('DELETE');
  });

  it('sends a POST request for getRandomWords', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse([]));
    const request = { count: 5 };

    await apiService.getRandomWords(request);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.wordsRandom}`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(request);
  });

  describe('getWordsCount', () => {
    it('sends a POST request with an empty body when no filter is provided', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ count: 0 }));

      await apiService.getWordsCount();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.wordsCount}`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
    });

    it('sends the search filter as the body when provided', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ count: 1 }));
      const searchFilter = {
        conditions: [
          { key: 'word', operator: SearchOperation.EQUALS, value: 'apple' },
        ],
        logic: SearchLogic.AND,
      };

      await apiService.getWordsCount(searchFilter);

      const [, options] = fetchMock.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual(searchFilter);
    });
  });

  it('sends a POST request to the word definition endpoint for addDefinition', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));
    const definition = { definition: 'a fruit' };

    await apiService.addDefinition(1, definition);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.wordDefinition(1)}`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(definition);
  });

  it('sends a PUT request to the definition endpoint for updateDefinition', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));

    await apiService.updateDefinition(1, { definition: 'updated' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.updateDefinition(1)}`,
    );
    expect(options.method).toBe('PUT');
  });

  it('sends a DELETE request to the definition endpoint for deleteDefinition', async () => {
    fetchMock.mockResolvedValueOnce(
      buildMockResponse(undefined, { contentType: null }),
    );

    await apiService.deleteDefinition(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.deleteDefinition(1)}`,
    );
    expect(options.method).toBe('DELETE');
  });

  describe('optional query parameters', () => {
    it('appends limit to the query string for getWordLogs when provided, and omits it otherwise', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getWordLogs(3, 5);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.wordLogs(3)}?limit=5`,
      );

      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getWordLogs(3);
      expect(fetchMock.mock.calls[1][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.wordLogs(3)}`,
      );
    });

    it('appends days to the query string for getWordsTrend when provided, and omits it otherwise', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getWordsTrend(30);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.wordsTrend}?days=30`,
      );

      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getWordsTrend();
      expect(fetchMock.mock.calls[1][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.wordsTrend}`,
      );
    });
  });

  it('sends a GET request for getWordStats', async () => {
    fetchMock.mockResolvedValueOnce(
      buildMockResponse({
        familiarity_distribution: { red: 0, yellow: 0, green: 0 },
        practice_count_distribution: [],
      }),
    );

    await apiService.getWordStats();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.wordsStats}`);
    expect(options.method).toBe('GET');
  });
});

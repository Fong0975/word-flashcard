// @vitest-environment node

import type { Mock } from 'vitest';

import { SearchOperation, SearchLogic } from '../types/base';

import { apiService } from './api';
import { API_CONFIG, API_ENDPOINTS } from './api-config';
import { buildMockResponse } from './apiTestHelpers';

describe('ApiService - questions', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it.each([
    {
      name: 'without a filter',
      params: {},
      query: '',
      body: {},
    },
    {
      name: 'with a filter, pagination and sort',
      params: {
        limit: 20,
        offset: 40,
        sort: 'count_practise',
        searchFilter: {
          conditions: [
            {
              key: 'question',
              operator: SearchOperation.LIKE,
              value: '%a%',
            },
          ],
          logic: SearchLogic.OR,
        },
      },
      query: '?limit=20&offset=40&sort=count_practise',
      body: {
        conditions: [{ key: 'question', operator: 'like', value: '%a%' }],
        logic: 'OR',
      },
    },
  ])(
    'sends a POST request for searchQuestions $name',
    async ({ params, query, body }) => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));

      await apiService.searchQuestions(params);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.questionsSearch}${query}`,
      );
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(body);
    },
  );

  it('sends a GET request for getQuestion', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 9 }));

    await apiService.getQuestion(9);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questionById(9)}`);
    expect(options.method).toBe('GET');
  });

  it('sends a POST request for createQuestion', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));
    const payload = { question: 'Q?', answer: 'A', option_a: 'A' };

    await apiService.createQuestion(payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questions}`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('sends a PUT request for updateQuestion', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));
    const payload = {
      question: 'Q?',
      answer: 'A',
      option_a: 'A',
      notes: '',
      reference: '',
    };

    await apiService.updateQuestion(1, payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questionById(1)}`);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it.each([
    { name: 'sets', reminder: 'check the tense' },
    { name: 'clears', reminder: '' },
  ])(
    'sends a PUT request carrying only the reminder when it $name one',
    async ({ reminder }) => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ id: 1 }));

      await apiService.updateQuestionReminder(1, reminder);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questionById(1)}`);
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual({ reminder });
    },
  );

  it('sends a DELETE request for deleteQuestion', async () => {
    fetchMock.mockResolvedValueOnce(
      buildMockResponse(undefined, { contentType: null }),
    );

    await apiService.deleteQuestion(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questionById(1)}`);
    expect(options.method).toBe('DELETE');
  });

  it('sends a POST request for getRandomQuestions', async () => {
    fetchMock.mockResolvedValueOnce(buildMockResponse([]));
    const request = { count: 3 };

    await apiService.getRandomQuestions(request);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questionsRandom}`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(request);
  });

  it.each([
    { name: 'without a filter', filter: undefined, body: {} },
    {
      name: 'with a filter',
      filter: {
        conditions: [
          { key: 'option_a', operator: SearchOperation.LIKE, value: '%a%' },
        ],
        logic: SearchLogic.OR,
      },
      body: {
        conditions: [{ key: 'option_a', operator: 'like', value: '%a%' }],
        logic: 'OR',
      },
    },
  ])(
    'sends a POST request for getQuestionsCount $name',
    async ({ filter, body }) => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ count: 0 }));

      await apiService.getQuestionsCount(filter);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questionsCount}`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(body);
    },
  );

  it('sends a GET request for getQuestionStats', async () => {
    fetchMock.mockResolvedValueOnce(
      buildMockResponse({
        accuracy_distribution: [],
        practice_count_distribution: [],
      }),
    );

    await apiService.getQuestionStats();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.questionsStats}`);
    expect(options.method).toBe('GET');
  });

  describe('optional query parameters', () => {
    it('appends limit to the query string for getQuestionLogs when provided, and omits it otherwise', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getQuestionLogs(3, 5);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.questionLogs(3)}?limit=5`,
      );

      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getQuestionLogs(3);
      expect(fetchMock.mock.calls[1][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.questionLogs(3)}`,
      );
    });

    it('appends days to the query string for getQuestionsTrend when provided, and omits it otherwise', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getQuestionsTrend(7);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.questionsTrend}?days=7`,
      );

      fetchMock.mockResolvedValueOnce(buildMockResponse([]));
      await apiService.getQuestionsTrend();
      expect(fetchMock.mock.calls[1][0]).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.questionsTrend}`,
      );
    });
  });
});

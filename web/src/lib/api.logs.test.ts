import type { Mock } from 'vitest';

import { apiService } from './api';
import { API_CONFIG, API_ENDPOINTS } from './api-config';
import { buildMockResponse } from './apiTestHelpers';

describe('ApiService - logs', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const urlOfLastCall = (): string => fetchMock.mock.calls[0][0];

  describe('getLogs', () => {
    it.each([
      {
        name: 'omits every parameter when none are provided',
        params: {},
        expectedQuery: '',
      },
      {
        name: 'sends pagination params',
        params: { limit: 50, offset: 100 },
        expectedQuery: '?limit=50&offset=100',
      },
      {
        name: 'joins levels into a single comma-separated parameter',
        params: { levels: ['WARN', 'ERROR'] as const },
        expectedQuery: '?level=WARN%2CERROR',
      },
      {
        name: 'omits an empty level list',
        params: { levels: [] as const, limit: 10 },
        expectedQuery: '?limit=10',
      },
      {
        name: 'sends the date range',
        params: { from: '2026-08-01', to: '2026-08-31' },
        expectedQuery: '?from=2026-08-01&to=2026-08-31',
      },
      {
        name: 'combines pagination, levels and range',
        params: {
          limit: 30,
          offset: 0,
          levels: ['ERROR'] as const,
          from: '2026-08-01',
        },
        expectedQuery: '?limit=30&offset=0&level=ERROR&from=2026-08-01',
      },
      {
        name: 'sends the keyword',
        params: { keyword: 'disk full' },
        expectedQuery: '?keyword=disk+full',
      },
      {
        name: 'omits a blank keyword',
        params: { keyword: '', limit: 10 },
        expectedQuery: '?limit=10',
      },
    ])('$name', async ({ params, expectedQuery }) => {
      fetchMock.mockResolvedValueOnce(buildMockResponse([]));

      await apiService.getLogs(params);

      expect(urlOfLastCall()).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.logs}${expectedQuery}`,
      );
    });

    it('returns the parsed entries', async () => {
      const entries = [
        {
          id: 1,
          timestamp: '2026-08-30T20:44:13Z',
          level: 'WARN',
          source: 'main.go:49',
          message: 'Something',
          file: 'app.log',
        },
      ];
      fetchMock.mockResolvedValueOnce(buildMockResponse(entries));

      await expect(apiService.getLogs()).resolves.toEqual(entries);
    });
  });

  describe('getLogsCount', () => {
    it('sends the filter but drops limit and offset, which are meaningless for a count', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ count: 7 }));

      const result = await apiService.getLogsCount({
        limit: 50,
        offset: 100,
        levels: ['WARN'],
        from: '2026-08-01',
        keyword: 'disk',
      });

      expect(urlOfLastCall()).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.logsCount}?level=WARN&from=2026-08-01&keyword=disk`,
      );
      expect(result).toEqual({ count: 7 });
    });
  });

  describe('getUnreadLogsCount', () => {
    it('requests the unread endpoint without parameters', async () => {
      fetchMock.mockResolvedValueOnce(buildMockResponse({ count: 3 }));

      const result = await apiService.getUnreadLogsCount();

      expect(urlOfLastCall()).toBe(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.logsUnread}`,
      );
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('markLogsRead', () => {
    it('posts an empty body and returns the stored watermark', async () => {
      const state = { last_read_at: '2026-08-31T09:00:00Z' };
      fetchMock.mockResolvedValueOnce(buildMockResponse(state));

      const result = await apiService.markLogsRead();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${API_CONFIG.baseURL}${API_ENDPOINTS.logsRead}`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual(state);
    });
  });
});

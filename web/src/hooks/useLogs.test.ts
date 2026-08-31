import { renderHook, waitFor } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { apiService } from '../lib/api';
import { LogEntry } from '../types/logs';

import { useLogs } from './useLogs';

const buildEntry = (id: number): LogEntry => ({
  id,
  timestamp: new Date(2026, 7, 30, 20, 44, 13).toISOString(),
  level: 'WARN',
  source: 'main.go:49',
  message: `entry ${id}`,
  file: 'app.log',
});

describe('useLogs', () => {
  let getLogs: MockInstance;
  let getLogsCount: MockInstance;

  beforeEach(() => {
    getLogs = vi
      .spyOn(apiService, 'getLogs')
      .mockResolvedValue([buildEntry(1), buildEntry(2)]);
    getLogsCount = vi
      .spyOn(apiService, 'getLogsCount')
      .mockResolvedValue({ count: 120 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the first page and derives pagination from the total count', async () => {
    const { result } = renderHook(() => useLogs({ itemsPerPage: 50 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.logs).toHaveLength(2);
    expect(result.current.totalCount).toBe(120);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrevious).toBe(false);
  });

  it.each([
    {
      name: 'passes no filter when none is set',
      options: {},
      expectedFilter: { levels: undefined, from: undefined, to: undefined },
    },
    {
      name: 'passes the level allow-list',
      options: { levels: ['WARN', 'ERROR'] as const },
      expectedFilter: {
        levels: ['WARN', 'ERROR'],
        from: undefined,
        to: undefined,
      },
    },
    {
      name: 'passes the date range',
      options: { from: '2026-08-01', to: '2026-08-31' },
      expectedFilter: {
        levels: undefined,
        from: '2026-08-01',
        to: '2026-08-31',
      },
    },
  ])('$name', async ({ options, expectedFilter }) => {
    const { result } = renderHook(() =>
      useLogs({ itemsPerPage: 50, ...options }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getLogs).toHaveBeenCalledWith({
      limit: 50,
      offset: 0,
      ...expectedFilter,
    });
    expect(getLogsCount).toHaveBeenCalledWith(expectedFilter);
  });

  it('translates a page change into an offset', async () => {
    const { result } = renderHook(() =>
      useLogs({ itemsPerPage: 50, initialPage: 3 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, offset: 100 }),
    );
  });

  it('does not fetch when autoFetch is disabled', () => {
    renderHook(() => useLogs({ autoFetch: false }));

    expect(getLogs).not.toHaveBeenCalled();
  });

  it('surfaces a fetch failure as an error message', async () => {
    getLogs.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useLogs({ itemsPerPage: 50 }));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.logs).toHaveLength(0);
  });
});

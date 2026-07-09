import { renderHook, act, waitFor } from '@testing-library/react';

import { useRefreshAction } from './useRefreshAction';

describe('useRefreshAction', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows a success toast and resets isRefreshing when there is no onRefresh callback', async () => {
    const { result } = renderHook(() => useRefreshAction());

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      message: 'Refresh successful!',
    });
  });

  it('awaits the onRefresh callback and shows success', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRefreshAction(onRefresh));

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('shows an error toast with the failure message when onRefresh rejects', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useRefreshAction(onRefresh));

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      message: 'network down',
    });
  });

  it('ignores a second refresh call while one is already in flight', async () => {
    let resolveRefresh: () => void = () => {};
    const onRefresh = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolveRefresh = resolve;
        }),
    );
    const { result } = renderHook(() => useRefreshAction(onRefresh));

    act(() => {
      result.current.handleRefresh();
    });
    await waitFor(() => expect(result.current.isRefreshing).toBe(true));

    await act(async () => {
      await result.current.handleRefresh();
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRefresh();
    });
    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
  });

  it('removeToast removes a toast by id', async () => {
    const { result } = renderHook(() => useRefreshAction());
    await act(async () => {
      await result.current.handleRefresh();
    });
    const id = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(id);
    });

    expect(result.current.toasts).toEqual([]);
  });
});

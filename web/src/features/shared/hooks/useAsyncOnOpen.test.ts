import { renderHook, waitFor } from '@testing-library/react';

import { useAsyncOnOpen } from './useAsyncOnOpen';

describe('useAsyncOnOpen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('does not fetch while closed', () => {
    const fetcher = jest.fn();
    renderHook(() =>
      useAsyncOnOpen({ isOpen: false, fetcher, errorMessage: 'failed' }),
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches and stores data when opened', async () => {
    const fetcher = jest.fn().mockResolvedValue({ word: 'apple' });
    const { result } = renderHook(() =>
      useAsyncOnOpen({ isOpen: true, fetcher, errorMessage: 'failed' }),
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ word: 'apple' });
    expect(result.current.error).toBeNull();
  });

  it('sets an error message when the fetch fails', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() =>
      useAsyncOnOpen({ isOpen: true, fetcher, errorMessage: 'Lookup failed' }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('network down');
    expect(result.current.data).toBeNull();
  });

  it('uses the fallback error message for a non-Error rejection', async () => {
    const fetcher = jest.fn().mockRejectedValue('boom');
    const { result } = renderHook(() =>
      useAsyncOnOpen({ isOpen: true, fetcher, errorMessage: 'Lookup failed' }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Lookup failed');
  });

  it('re-fetches each time isOpen transitions to true', async () => {
    const fetcher = jest.fn().mockResolvedValue('data');
    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useAsyncOnOpen({ isOpen, fetcher, errorMessage: 'failed' }),
      { initialProps: { isOpen: true } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);

    rerender({ isOpen: false });
    rerender({ isOpen: true });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});

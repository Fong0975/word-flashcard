import { renderHook, waitFor } from '@testing-library/react';

import { apiService } from '../lib/api';

import { ApiVersionProvider, useApiVersion } from './ApiVersionContext';

describe('ApiVersionContext', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('defaults to a null apiVersion outside of a provider', () => {
    const { result } = renderHook(() => useApiVersion());
    expect(result.current.apiVersion).toBeNull();
  });

  it('reads a previously cached version from sessionStorage without fetching', () => {
    sessionStorage.setItem('api_version', '1.2.3');
    const getInformationSpy = jest.spyOn(apiService, 'getInformation');

    const { result } = renderHook(() => useApiVersion(), {
      wrapper: ApiVersionProvider,
    });

    expect(result.current.apiVersion).toBe('1.2.3');
    expect(getInformationSpy).not.toHaveBeenCalled();
  });

  it('fetches and caches the version when nothing is cached', async () => {
    jest
      .spyOn(apiService, 'getInformation')
      .mockResolvedValue({ version: '2.0.0' });

    const { result } = renderHook(() => useApiVersion(), {
      wrapper: ApiVersionProvider,
    });
    expect(result.current.apiVersion).toBeNull();

    await waitFor(() => expect(result.current.apiVersion).toBe('2.0.0'));
    expect(sessionStorage.getItem('api_version')).toBe('2.0.0');
  });

  it('leaves the version null and logs the error when the fetch fails', async () => {
    const error = new Error('network down');
    jest.spyOn(apiService, 'getInformation').mockRejectedValue(error);

    const { result } = renderHook(() => useApiVersion(), {
      wrapper: ApiVersionProvider,
    });

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch API version:',
        error,
      ),
    );
    expect(result.current.apiVersion).toBeNull();
    expect(sessionStorage.getItem('api_version')).toBeNull();
  });
});

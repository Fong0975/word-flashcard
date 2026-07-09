import { renderHook, act } from '@testing-library/react';

import { CambridgeApiResponse, CambridgeDefinition } from '../types';
import { apiService, ApiError } from '../../../../lib/api';

import { useDictionaryData } from './useDictionaryData';

const buildResponse = (
  overrides: Partial<CambridgeApiResponse> = {},
): CambridgeApiResponse => ({
  word: 'apple',
  pos: ['noun'],
  verbs: [],
  pronunciation: [],
  definition: [],
  ...overrides,
});

describe('useDictionaryData', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('sets an error immediately when there is no word to look up', async () => {
    const lookupSpy = jest.spyOn(apiService, 'lookupWord');
    const { result } = renderHook(() => useDictionaryData(null));

    await act(async () => {
      await result.current.fetchDictionaryData();
    });

    expect(result.current.dictionaryError).toBe('No word available to search');
    expect(lookupSpy).not.toHaveBeenCalled();
  });

  it('fetches and stores dictionary data, expanding the section', async () => {
    const response = buildResponse();
    jest.spyOn(apiService, 'lookupWord').mockResolvedValue(response);
    const { result } = renderHook(() => useDictionaryData('apple'));
    expect(result.current.isCollapsed).toBe(true);

    await act(async () => {
      await result.current.fetchDictionaryData();
    });

    expect(result.current.dictionaryData).toEqual(response);
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.dictionaryError).toBeNull();
  });

  it('reports a generic error message on failure', async () => {
    jest
      .spyOn(apiService, 'lookupWord')
      .mockRejectedValue(new Error('network down'));
    const onShowError = jest.fn();
    const { result } = renderHook(() =>
      useDictionaryData('apple', undefined, onShowError),
    );

    await act(async () => {
      await result.current.fetchDictionaryData();
    });

    expect(result.current.dictionaryError).toBe('network down');
    expect(onShowError).toHaveBeenCalledWith(
      'Error fetching dictionary data: network down',
    );
  });

  it('adds a manual-entry hint when the upstream dictionary is unavailable', async () => {
    jest
      .spyOn(apiService, 'lookupWord')
      .mockRejectedValue(
        new ApiError(
          502,
          'Bad Gateway',
          'Cambridge is down',
          undefined,
          'upstream_unavailable',
        ),
      );
    const { result } = renderHook(() => useDictionaryData('apple'));

    await act(async () => {
      await result.current.fetchDictionaryData();
    });

    expect(result.current.dictionaryError).toBe(
      'Cambridge is down You can still fill in the definition manually.',
    );
  });

  it('applies pronunciation data to the form and shows a success message', () => {
    const updateFormData = jest.fn();
    const onShowSuccess = jest.fn();
    const { result } = renderHook(() =>
      useDictionaryData('apple', onShowSuccess),
    );

    act(() => {
      result.current.applyPronunciation(
        'uk.mp3',
        'us.mp3',
        'noun',
        updateFormData,
      );
    });

    expect(updateFormData).toHaveBeenCalledWith({
      phonetics: { uk: 'uk.mp3', us: 'us.mp3' },
    });
    expect(onShowSuccess).toHaveBeenCalledWith(
      'UK and US pronunciation URLs (noun) applied successfully!',
    );
  });

  it('applies definition data to the form and shows a success message', () => {
    const updateFormData = jest.fn();
    const onShowSuccess = jest.fn();
    const { result } = renderHook(() =>
      useDictionaryData('apple', onShowSuccess),
    );
    const definition: CambridgeDefinition = {
      id: 1,
      pos: 'noun',
      text: 'a fruit',
      translation: '蘋果',
      example: [
        { id: 1, text: 'I ate an apple', translation: '我吃了一顆蘋果' },
      ],
    };

    act(() => {
      result.current.applyDefinition(definition, updateFormData);
    });

    expect(updateFormData).toHaveBeenCalledWith({
      part_of_speech: ['noun'],
      definition: '蘋果 a fruit',
      examples: ['I ate an apple 我吃了一顆蘋果'],
    });
    expect(onShowSuccess).toHaveBeenCalledWith(
      'Applied part of speech, definition, 1 example successfully!',
    );
  });

  it('resets the dictionary state', async () => {
    jest.spyOn(apiService, 'lookupWord').mockResolvedValue(buildResponse());
    const { result } = renderHook(() => useDictionaryData('apple'));
    await act(async () => {
      await result.current.fetchDictionaryData();
    });

    act(() => {
      result.current.resetDictionaryData();
    });

    expect(result.current.dictionaryData).toBeNull();
    expect(result.current.dictionaryError).toBeNull();
    expect(result.current.isCollapsed).toBe(true);
  });

  it('toggles the collapsed state', () => {
    const { result } = renderHook(() => useDictionaryData('apple'));
    expect(result.current.isCollapsed).toBe(true);

    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.isCollapsed).toBe(false);
  });

  it('uses externally-controlled state when provided', () => {
    const setDictionaryData = jest.fn();
    const { result } = renderHook(() =>
      useDictionaryData('apple', undefined, undefined, {
        dictionaryData: buildResponse({ word: 'external' }),
        isLoadingDictionary: false,
        dictionaryError: null,
        isCollapsed: false,
        setDictionaryData,
        setIsLoadingDictionary: jest.fn(),
        setDictionaryError: jest.fn(),
        setIsCollapsed: jest.fn(),
      }),
    );

    expect(result.current.dictionaryData).toEqual(
      buildResponse({ word: 'external' }),
    );

    act(() => {
      result.current.resetDictionaryData();
    });

    expect(setDictionaryData).toHaveBeenCalledWith(null);
  });
});

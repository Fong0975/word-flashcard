import { renderHook, act } from '@testing-library/react';

import { Word } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { apiService } from '../../../../lib/api';
import { WordFormData, WordFormSubmitCallbacks } from '../types';

import { useWordSubmit } from './useWordSubmit';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

const buildFormData = (
  overrides: Partial<WordFormData> = {},
): WordFormData => ({
  word: 'cat',
  familiarity: FamiliarityLevel.GREEN,
  ...overrides,
});

const buildCallbacks = (
  overrides: Partial<WordFormSubmitCallbacks> = {},
): WordFormSubmitCallbacks => ({
  onClose: jest.fn(),
  ...overrides,
});

describe('useWordSubmit', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('rejects a blank word without calling the API', async () => {
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'create',
        callbacks: buildCallbacks(),
        resetForm: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData({ word: '   ' }));
    });

    expect(result.current.error).toBe('Please enter a word');
  });

  it('creates the word and opens its detail page once found', async () => {
    const createdWord = buildWord({ id: 2, word: 'cat' });
    jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValueOnce([]) // duplicate check
      .mockResolvedValueOnce([createdWord]); // post-create lookup
    const createWordSpy = jest
      .spyOn(apiService, 'createWord')
      .mockResolvedValue(createdWord);
    const resetForm = jest.fn();
    const onClose = jest.fn();
    const onWordSaved = jest.fn();
    const onOpenWordDetail = jest.fn();
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'create',
        callbacks: buildCallbacks({ onClose, onWordSaved, onOpenWordDetail }),
        resetForm,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData({ word: 'cat' }));
    });

    expect(createWordSpy).toHaveBeenCalledWith({ word: 'cat' });
    expect(resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onWordSaved).toHaveBeenCalledWith('cat');
    expect(onOpenWordDetail).toHaveBeenCalledWith(createdWord);
    expect(result.current.error).toBeNull();
  });

  it('rejects a duplicate word without creating it', async () => {
    jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ word: 'cat' })]);
    const createWordSpy = jest.spyOn(apiService, 'createWord');
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'create',
        callbacks: buildCallbacks(),
        resetForm: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData({ word: 'cat' }));
    });

    expect(result.current.error).toBe('Word "cat" already exists');
    expect(createWordSpy).not.toHaveBeenCalled();
  });

  it('updates the word without a duplicate check when the text is unchanged', async () => {
    const word = buildWord({ id: 3, word: 'apple' });
    const updateWordFieldsSpy = jest
      .spyOn(apiService, 'updateWordFields')
      .mockResolvedValue(word);
    const searchWordsSpy = jest.spyOn(apiService, 'searchWords');
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'edit',
        word,
        callbacks: buildCallbacks(),
        resetForm: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(
        buildFormData({
          word: 'apple',
          familiarity: FamiliarityLevel.RED,
          reminder: 'call back',
        }),
      );
    });

    expect(searchWordsSpy).not.toHaveBeenCalled();
    expect(updateWordFieldsSpy).toHaveBeenCalledWith(3, {
      word: 'apple',
      familiarity: FamiliarityLevel.RED,
      reminder: 'call back',
    });
  });

  it('checks for duplicates when the word text changes in edit mode', async () => {
    const word = buildWord({ id: 3, word: 'apple' });
    jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ word: 'banana' })]);
    const updateWordFieldsSpy = jest.spyOn(apiService, 'updateWordFields');
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'edit',
        word,
        callbacks: buildCallbacks(),
        resetForm: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData({ word: 'banana' }));
    });

    expect(result.current.error).toBe('Word "banana" already exists');
    expect(updateWordFieldsSpy).not.toHaveBeenCalled();
  });

  it('sets an error message when the API call fails', async () => {
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([]);
    jest
      .spyOn(apiService, 'createWord')
      .mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'create',
        callbacks: buildCallbacks(),
        resetForm: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData({ word: 'cat' }));
    });

    expect(result.current.error).toBe('network down');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('does not re-open the detail page when the created word is already in the current list', async () => {
    const searchWordsSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([]);
    jest
      .spyOn(apiService, 'createWord')
      .mockResolvedValue(buildWord({ id: 2, word: 'cat' }));
    const onOpenWordDetail = jest.fn();
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'create',
        currentWords: [buildWord({ id: 9, word: 'cat' })],
        callbacks: buildCallbacks({ onOpenWordDetail }),
        resetForm: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData({ word: 'cat' }));
    });

    expect(searchWordsSpy).toHaveBeenCalledTimes(1);
    expect(onOpenWordDetail).not.toHaveBeenCalled();
  });

  it('warns instead of erroring when the post-create lookup fails', async () => {
    jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValueOnce([]) // duplicate check
      .mockRejectedValueOnce(new Error('lookup failed')); // post-create lookup
    jest
      .spyOn(apiService, 'createWord')
      .mockResolvedValue(buildWord({ id: 2, word: 'cat' }));
    const onWarning = jest.fn();
    const { result } = renderHook(() =>
      useWordSubmit({
        mode: 'create',
        callbacks: buildCallbacks({ onOpenWordDetail: jest.fn() }),
        resetForm: jest.fn(),
        onWarning,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(buildFormData({ word: 'cat' }));
    });

    expect(onWarning).toHaveBeenCalledWith(
      'Failed to search for newly created word: lookup failed',
    );
    expect(result.current.error).toBeNull();
  });
});

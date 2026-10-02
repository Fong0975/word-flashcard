import { renderHook, act } from '@testing-library/react';

import { apiService } from '../../lib/api';
import { Word } from '../../types/api';
import { FamiliarityLevel } from '../../types/base';

import {
  hasExactWordMatch,
  useAddWordFromSearch,
} from './useAddWordFromSearch';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('hasExactWordMatch', () => {
  const words = [
    buildWord({ word: 'Apple' }),
    buildWord({ id: 2, word: 'pineapple' }),
  ];

  it.each([
    { name: 'exact match', term: 'Apple', expected: true },
    { name: 'case-insensitive match', term: 'apple', expected: true },
    { name: 'trimmed term', term: '  apple ', expected: true },
    { name: 'partial match only', term: 'app', expected: false },
    { name: 'no match', term: 'cat', expected: false },
  ])('$name', ({ term, expected }) => {
    expect(hasExactWordMatch(words, term)).toBe(expected);
  });

  it('returns false for an empty list', () => {
    expect(hasExactWordMatch([], 'apple')).toBe(false);
  });
});

describe('useAddWordFromSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setup = () => {
    const onAdded = vi.fn();
    const onError = vi.fn();
    const hook = renderHook(() => useAddWordFromSearch({ onAdded, onError }));
    return { ...hook, onAdded, onError };
  };

  it('stores a trimmed pending word on requestAdd and ignores blank input', () => {
    const { result } = setup();

    act(() => result.current.requestAdd('   '));
    expect(result.current.pendingWord).toBeNull();

    act(() => result.current.requestAdd('  cat '));
    expect(result.current.pendingWord).toBe('cat');
  });

  it('clears the pending word on cancelAdd', () => {
    const { result } = setup();

    act(() => result.current.requestAdd('cat'));
    act(() => result.current.cancelAdd());
    expect(result.current.pendingWord).toBeNull();
  });

  it('does nothing on confirmAdd without a pending word', async () => {
    const searchSpy = vi.spyOn(apiService, 'searchWords');
    const { result } = setup();

    await act(() => result.current.confirmAdd());
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it('creates the word and calls onAdded on confirmAdd', async () => {
    const created = buildWord({ id: 9, word: 'cat' });
    vi.spyOn(apiService, 'searchWords').mockResolvedValue([]);
    const createSpy = vi
      .spyOn(apiService, 'createWord')
      .mockResolvedValue(created);
    const { result, onAdded, onError } = setup();

    act(() => result.current.requestAdd('cat'));
    await act(() => result.current.confirmAdd());

    expect(createSpy).toHaveBeenCalledWith({ word: 'cat' });
    expect(onAdded).toHaveBeenCalledWith(created);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.pendingWord).toBeNull();
    expect(result.current.isAdding).toBe(false);
  });

  it('reports a duplicate without creating the word', async () => {
    vi.spyOn(apiService, 'searchWords').mockResolvedValue([
      buildWord({ word: 'Cat' }),
    ]);
    const createSpy = vi.spyOn(apiService, 'createWord');
    const { result, onAdded, onError } = setup();

    act(() => result.current.requestAdd('cat'));
    await act(() => result.current.confirmAdd());

    expect(createSpy).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Word "cat" already exists');
    expect(result.current.pendingWord).toBeNull();
  });

  it('reports an error when creation fails', async () => {
    vi.spyOn(apiService, 'searchWords').mockResolvedValue([]);
    vi.spyOn(apiService, 'createWord').mockRejectedValue(new Error('boom'));
    const { result, onAdded, onError } = setup();

    act(() => result.current.requestAdd('cat'));
    await act(() => result.current.confirmAdd());

    expect(onAdded).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.pendingWord).toBeNull();
    expect(result.current.isAdding).toBe(false);
  });
});

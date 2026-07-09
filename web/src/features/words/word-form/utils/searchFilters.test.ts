import { Word } from '../../../../types/api';
import {
  SearchOperation,
  SearchLogic,
  FamiliarityLevel,
} from '../../../../types/base';

import {
  createWordSearchFilter,
  createExactWordSearchFilter,
  filterSearchSuggestions,
} from './searchFilters';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('createWordSearchFilter', () => {
  it('wraps the search term with wildcards using LIKE/OR', () => {
    expect(createWordSearchFilter('app')).toEqual({
      conditions: [
        { key: 'word', operator: SearchOperation.LIKE, value: '%app%' },
      ],
      logic: SearchLogic.OR,
    });
  });
});

describe('createExactWordSearchFilter', () => {
  it('uses the raw word value without wildcards', () => {
    expect(createExactWordSearchFilter('apple')).toEqual({
      conditions: [
        { key: 'word', operator: SearchOperation.LIKE, value: 'apple' },
      ],
      logic: SearchLogic.OR,
    });
  });
});

describe('filterSearchSuggestions', () => {
  it('excludes a result that exactly matches the search term, case-insensitively', () => {
    const results = [
      buildWord({ id: 1, word: 'Apple' }),
      buildWord({ id: 2, word: 'Application' }),
    ];
    const filtered = filterSearchSuggestions(results, 'apple', 'create');
    expect(filtered.map(w => w.id)).toEqual([2]);
  });

  it('keeps all non-exact matches in create mode', () => {
    const results = [
      buildWord({ id: 1, word: 'Application' }),
      buildWord({ id: 2, word: 'Apply' }),
    ];
    const filtered = filterSearchSuggestions(results, 'app', 'create');
    expect(filtered.map(w => w.id)).toEqual([1, 2]);
  });

  it('excludes the word currently being edited in edit mode', () => {
    const editingWord = buildWord({ id: 2, word: 'Apply' });
    const results = [buildWord({ id: 1, word: 'Application' }), editingWord];
    const filtered = filterSearchSuggestions(
      results,
      'app',
      'edit',
      editingWord,
    );
    expect(filtered.map(w => w.id)).toEqual([1]);
  });

  it('does not exclude other words by id in edit mode', () => {
    const editingWord = buildWord({ id: 99, word: 'Unrelated' });
    const results = [buildWord({ id: 1, word: 'Application' })];
    const filtered = filterSearchSuggestions(
      results,
      'app',
      'edit',
      editingWord,
    );
    expect(filtered.map(w => w.id)).toEqual([1]);
  });

  it('does not throw when editingWord is undefined in edit mode', () => {
    const results = [buildWord({ id: 1, word: 'Application' })];
    expect(() =>
      filterSearchSuggestions(results, 'app', 'edit', undefined),
    ).not.toThrow();
  });
});

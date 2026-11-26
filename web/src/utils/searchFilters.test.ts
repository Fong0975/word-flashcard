// @vitest-environment node

import { SearchOperation, SearchLogic } from '../types/base';

import {
  createExactWordSearchFilter,
  escapeLikePattern,
} from './searchFilters';

describe('escapeLikePattern', () => {
  it.each([
    { name: 'plain text', input: 'take off', expected: 'take off' },
    { name: 'percent sign', input: '50%', expected: '50\\%' },
    { name: 'underscores', input: '___', expected: '\\_\\_\\_' },
    { name: 'backslash', input: 'a\\b', expected: 'a\\\\b' },
    { name: 'backslash before wildcard', input: '\\%', expected: '\\\\\\%' },
  ])('escapes $name', ({ input, expected }) => {
    expect(escapeLikePattern(input)).toBe(expected);
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

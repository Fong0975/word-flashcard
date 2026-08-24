import { SearchOperation, SearchLogic } from '../types/base';

import { createExactWordSearchFilter } from './searchFilters';

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

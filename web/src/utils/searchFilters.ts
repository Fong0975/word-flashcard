import { SearchOperation, SearchLogic } from '../types/base';

export const createExactWordSearchFilter = (word: string) => {
  return {
    conditions: [
      {
        key: 'word',
        operator: SearchOperation.LIKE,
        value: word,
      },
    ],
    logic: SearchLogic.OR,
  };
};

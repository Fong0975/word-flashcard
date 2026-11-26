import { SearchOperation, SearchLogic } from '../types/base';

/**
 * Escapes the SQL LIKE wildcards (`%`, `_`) and the escape character (`\`),
 * so that user input is matched literally.
 *
 * @param value - Raw text to be embedded in a LIKE pattern.
 * @returns The escaped text, without any surrounding wildcards.
 */
export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');

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

import {
  detectCompletedBacktickWord,
  findAllBacktickWords,
  hasWordLinkAfter,
  insertWordLink,
} from './wordLinkFormatting';

describe('detectCompletedBacktickWord', () => {
  it.each([
    [
      'returns null when the character before the cursor is not a backtick',
      '`apple`',
      6,
      null,
    ],
    [
      'returns null when there is no opening backtick before it',
      'apple`',
      6,
      null,
    ],
    [
      'returns null when the content between backticks contains a newline',
      '`foo\nbar`',
      9,
      null,
    ],
    ['returns null when the content is empty', '``', 2, null],
    ['returns null when the content is whitespace only', '`   `', 5, null],
    [
      'trims surrounding whitespace but keeps the word',
      '` apple `',
      9,
      { word: 'apple', openIndex: 0, closeIndex: 8 },
    ],
    [
      'detects a pair completed in the middle of the value',
      'Check `cat` now',
      11,
      { word: 'cat', openIndex: 6, closeIndex: 10 },
    ],
  ] as const)('%s', (_description, value, cursorPosition, expected) => {
    expect(detectCompletedBacktickWord(value, cursorPosition)).toEqual(
      expected,
    );
  });
});

describe('findAllBacktickWords', () => {
  it.each([
    [
      'returns an empty array when there are no backtick pairs',
      'no backticks here',
      [],
    ],
    [
      'returns a single match for one pair',
      'Check `cat` now',
      [{ word: 'cat', openIndex: 6, closeIndex: 10 }],
    ],
    [
      'returns every pair in document order',
      '`apple` and `banana` and `cherry`',
      [
        { word: 'apple', openIndex: 0, closeIndex: 6 },
        { word: 'banana', openIndex: 12, closeIndex: 19 },
        { word: 'cherry', openIndex: 25, closeIndex: 32 },
      ],
    ],
    [
      'trims surrounding whitespace but keeps the word',
      '` apple `',
      [{ word: 'apple', openIndex: 0, closeIndex: 8 }],
    ],
    ['skips a pair whose content is empty', '``', []],
    ['skips a pair whose content is whitespace only', '`   `', []],
    ['skips a pair whose content contains a newline', '`foo\nbar`', []],
    [
      'skips an empty pair but keeps the valid ones around it',
      '`apple` `` `banana`',
      [
        { word: 'apple', openIndex: 0, closeIndex: 6 },
        { word: 'banana', openIndex: 11, closeIndex: 18 },
      ],
    ],
    [
      'ignores a trailing unmatched backtick',
      '`apple` and `stray',
      [{ word: 'apple', openIndex: 0, closeIndex: 6 }],
    ],
  ] as const)('%s', (_description, value, expected) => {
    expect(findAllBacktickWords(value)).toEqual(expected);
  });
});

describe('hasWordLinkAfter', () => {
  it.each([
    [
      'detects an existing link immediately after the position',
      'abc([link](/word/abc))',
      3,
      true,
    ],
    ['returns false when different text follows', 'abcXYZ', 3, false],
    ['returns false at the end of the string', 'abc', 3, false],
    [
      'returns false when the link marker is not at the very start of the remaining text',
      'abc ([link](/word/abc))',
      3,
      false,
    ],
  ] as const)('%s', (_description, value, position, expected) => {
    expect(hasWordLinkAfter(value, position)).toBe(expected);
  });
});

describe('insertWordLink', () => {
  it.each([
    [
      'inserts the link at the given position and moves the cursor after it',
      '`apple` end',
      7,
      'apple',
      {
        value: '`apple`([link](/word/apple)) end',
        selectionStart: 28,
        selectionEnd: 28,
      },
    ],
    [
      'encodes special characters in the word for the URL',
      'X',
      1,
      'give up',
      {
        value: 'X([link](/word/give%20up))',
        selectionStart: 26,
        selectionEnd: 26,
      },
    ],
    [
      'inserts at the start of the string',
      'rest',
      0,
      'w',
      {
        value: '([link](/word/w))rest',
        selectionStart: 17,
        selectionEnd: 17,
      },
    ],
  ] as const)('%s', (_description, value, position, word, expected) => {
    expect(insertWordLink(value, position, word)).toEqual(expected);
  });
});

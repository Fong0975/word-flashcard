// @vitest-environment node

import {
  MAX_SHORT_DETAIL_WIDTH,
  PageTitleOptions,
  formatPageTitle,
  truncateToWidth,
  withPageNumber,
} from './pageTitle';

describe('truncateToWidth', () => {
  it.each([
    ['text shorter than the limit', 'hello', 10, 'hello'],
    ['text exactly at the limit', 'abcdefghij', 10, 'abcdefghij'],
    ['text one column over the limit', 'abcdefghijk', 10, 'abcdefghi…'],
    ['CJK text exactly at the limit', '單字卡片學習', 12, '單字卡片學習'],
    ['CJK text over the limit', '單字卡片學習法', 12, '單字卡片學…'],
    ['mixed CJK and Latin text', 'ab單字cd', 6, 'ab單…'],
    ['emoji without splitting surrogate pairs', '😀😀😀😀', 6, '😀😀…'],
    ['a cut that lands after a space', 'hello world', 7, 'hello…'],
    ['an empty string', '', 10, ''],
  ])('handles %s', (_, text, maxWidth, expected) => {
    expect(truncateToWidth(text, maxWidth)).toBe(expected);
  });
});

describe('formatPageTitle', () => {
  it.each<
    [
      string,
      string | null | undefined,
      string | null | undefined,
      PageTitleOptions | undefined,
      string,
    ]
  >([
    ['nothing', undefined, undefined, undefined, 'Flashcard'],
    ['empty and null parts', '', null, undefined, 'Flashcard'],
    ['whitespace-only parts', '  ', '\n', undefined, 'Flashcard'],
    ['a page type only', 'Words', undefined, undefined, 'Words | Flashcard'],
    ['a detail only', undefined, 'apple', undefined, 'apple | Flashcard'],
    [
      'a page type and a detail',
      'Word',
      'apple',
      undefined,
      'Word - apple | Flashcard',
    ],
    [
      'a detail with newlines and repeated spaces',
      'Note',
      'line one\n  line   two',
      undefined,
      'Note - line one line two | Flashcard',
    ],
    [
      'a detail over the default width',
      'Word',
      'a'.repeat(41),
      undefined,
      `Word - ${'a'.repeat(39)}… | Flashcard`,
    ],
    [
      'a detail over a custom width',
      'Note',
      'x'.repeat(26),
      { maxDetailWidth: MAX_SHORT_DETAIL_WIDTH },
      `Note - ${'x'.repeat(24)}… | Flashcard`,
    ],
    [
      'a detail prefix without a detail',
      'Question',
      undefined,
      { detailPrefix: '#12' },
      'Question - #12 | Flashcard',
    ],
    [
      'a detail prefix that is not counted against the width',
      'Question',
      'q'.repeat(26),
      { detailPrefix: '#12', maxDetailWidth: MAX_SHORT_DETAIL_WIDTH },
      `Question - #12 ${'q'.repeat(24)}… | Flashcard`,
    ],
    [
      'a null detail prefix',
      'Question',
      'Q?',
      { detailPrefix: null },
      'Question - Q? | Flashcard',
    ],
  ])('formats %s', (_, pageType, detail, options, expected) => {
    expect(formatPageTitle(pageType, detail, options)).toBe(expected);
  });
});

describe('withPageNumber', () => {
  it.each([
    ['page 0', 0, 'Words'],
    ['the first page', 1, 'Words'],
    ['the second page', 2, 'Words (Page 2)'],
    ['a later page', 37, 'Words (Page 37)'],
    ['a non-numeric page', NaN, 'Words'],
  ])('handles %s', (_, page, expected) => {
    expect(withPageNumber('Words', page)).toBe(expected);
  });
});

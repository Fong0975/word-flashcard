import { insertSymbol, SYMBOL_CURSOR_MARKER } from './symbolFormatting';

describe('insertSymbol', () => {
  it.each([
    [
      'inserts at the cursor when there is no selection',
      'ab',
      1,
      1,
      '→',
      { value: 'a→b', selectionStart: 2, selectionEnd: 2 },
    ],
    [
      'replaces the selected text with the symbol',
      'abcd',
      1,
      3,
      '•',
      { value: 'a•d', selectionStart: 2, selectionEnd: 2 },
    ],
    [
      'inserts at the start of the string',
      'rest',
      0,
      0,
      '…',
      { value: '…rest', selectionStart: 1, selectionEnd: 1 },
    ],
    [
      'inserts at the end of the string',
      'start',
      5,
      5,
      '—',
      { value: 'start—', selectionStart: 6, selectionEnd: 6 },
    ],
    [
      'strips the cursor marker and places the cursor there, with no selection',
      'ab',
      1,
      1,
      `“${SYMBOL_CURSOR_MARKER}”`,
      { value: 'a“”b', selectionStart: 2, selectionEnd: 2 },
    ],
    [
      'strips the cursor marker and places the cursor there, replacing a selection',
      'a bc d',
      2,
      4,
      `“${SYMBOL_CURSOR_MARKER}”`,
      { value: 'a “” d', selectionStart: 3, selectionEnd: 3 },
    ],
  ] as const)(
    '%s',
    (_description, value, start, end, symbolValue, expected) => {
      expect(insertSymbol(value, start, end, symbolValue)).toEqual(expected);
    },
  );
});

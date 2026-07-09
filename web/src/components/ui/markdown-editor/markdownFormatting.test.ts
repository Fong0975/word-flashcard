import {
  applyBold,
  applyItalic,
  applyUnderline,
  applyCode,
  applyQuote,
  applyBulletList,
  applyNumberedList,
  applyLink,
} from './markdownFormatting';

describe('applyBold', () => {
  it('wraps the selected text and keeps it selected', () => {
    expect(applyBold('Hello world', 0, 5)).toEqual({
      value: '**Hello** world',
      selectionStart: 2,
      selectionEnd: 7,
    });
  });

  it('collapses the markers around the cursor when there is no selection', () => {
    expect(applyBold('Hello world', 5, 5)).toEqual({
      value: 'Hello**** world',
      selectionStart: 7,
      selectionEnd: 7,
    });
  });
});

describe('applyItalic', () => {
  it('wraps the selected text with single asterisks', () => {
    expect(applyItalic('Hello world', 0, 5)).toEqual({
      value: '*Hello* world',
      selectionStart: 1,
      selectionEnd: 6,
    });
  });
});

describe('applyUnderline', () => {
  it('wraps the selected text with <ins> tags', () => {
    expect(applyUnderline('Hello world', 0, 5)).toEqual({
      value: '<ins>Hello</ins> world',
      selectionStart: 5,
      selectionEnd: 10,
    });
  });
});

describe('applyCode', () => {
  it('wraps a single-line selection with single backticks', () => {
    expect(applyCode('Hello world', 0, 5)).toEqual({
      value: '`Hello` world',
      selectionStart: 1,
      selectionEnd: 6,
    });
  });

  it('wraps a multi-line selection with a fenced code block', () => {
    const value = 'line1\nline2';
    expect(applyCode(value, 0, value.length)).toEqual({
      value: '```\nline1\nline2\n```',
      selectionStart: 4,
      selectionEnd: 15,
    });
  });
});

describe('applyQuote', () => {
  it('prefixes the current line and places the cursor after the marker', () => {
    expect(applyQuote('Hello world', 5, 5)).toEqual({
      value: '> Hello world',
      selectionStart: 7,
      selectionEnd: 7,
    });
  });
});

describe('applyBulletList', () => {
  it('prefixes every line touched by the selection and selects the whole block', () => {
    const value = 'line1\nline2\nline3';
    expect(applyBulletList(value, 2, 8)).toEqual({
      value: '- line1\n- line2\nline3',
      selectionStart: 0,
      selectionEnd: 15,
    });
  });
});

describe('applyNumberedList', () => {
  it('prefixes the current line with "1. " and places the cursor after it', () => {
    expect(applyNumberedList('Hello', 0, 0)).toEqual({
      value: '1. Hello',
      selectionStart: 3,
      selectionEnd: 3,
    });
  });
});

describe('applyLink', () => {
  it('inserts empty brackets with the cursor inside the label when there is no selection', () => {
    expect(applyLink('Hello', 0, 0)).toEqual({
      value: '[]()Hello',
      selectionStart: 1,
      selectionEnd: 1,
    });
  });

  it('uses the selection as the label and selects the placeholder url', () => {
    expect(applyLink('Hello world', 0, 5)).toEqual({
      value: '[Hello](url) world',
      selectionStart: 8,
      selectionEnd: 11,
    });
  });
});

export interface MarkdownFormatResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface InlineWrap {
  before: string;
  after: string;
}

/**
 * Wraps the selected range with `before`/`after` markers.
 * With a selection, the wrapped original text stays selected so the result is visible.
 * Without a selection, `before` and `after` collapse around the cursor (e.g. `**|**`)
 * so typing continues right between the markers.
 */
const applyInlineWrap = (
  value: string,
  start: number,
  end: number,
  { before, after }: InlineWrap,
): MarkdownFormatResult => {
  const selected = value.slice(start, end);
  const newValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  const selectionStart = start + before.length;
  const selectionEnd = selectionStart + selected.length;

  return { value: newValue, selectionStart, selectionEnd };
};

/**
 * Prefixes every line touched by the selection (or the current line, if there is no
 * selection) using `prefixForLine(lineIndex)`. With a selection, the whole rewritten
 * block is selected afterwards; without one, the cursor lands right after the prefix.
 */
const applyLinePrefix = (
  value: string,
  start: number,
  end: number,
  prefixForLine: (lineIndex: number) => string,
): MarkdownFormatResult => {
  const blockStart = value.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = value.indexOf('\n', end);
  const blockEnd = nextBreak === -1 ? value.length : nextBreak;

  const lines = value.slice(blockStart, blockEnd).split('\n');
  const newBlock = lines
    .map((line, index) => prefixForLine(index) + line)
    .join('\n');
  const newValue =
    value.slice(0, blockStart) + newBlock + value.slice(blockEnd);

  if (start === end) {
    const cursor = start + prefixForLine(0).length;
    return { value: newValue, selectionStart: cursor, selectionEnd: cursor };
  }

  return {
    value: newValue,
    selectionStart: blockStart,
    selectionEnd: blockStart + newBlock.length,
  };
};

export const applyBold = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult =>
  applyInlineWrap(value, start, end, { before: '**', after: '**' });

export const applyItalic = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult =>
  applyInlineWrap(value, start, end, { before: '*', after: '*' });

export const applyUnderline = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult =>
  applyInlineWrap(value, start, end, { before: '<ins>', after: '</ins>' });

export const applyCode = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult => {
  const selected = value.slice(start, end);
  if (selected.includes('\n')) {
    return applyInlineWrap(value, start, end, {
      before: '```\n',
      after: '\n```',
    });
  }
  return applyInlineWrap(value, start, end, { before: '`', after: '`' });
};

export const applyQuote = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult => applyLinePrefix(value, start, end, () => '> ');

export const applyBulletList = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult => applyLinePrefix(value, start, end, () => '- ');

export const applyNumberedList = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult =>
  applyLinePrefix(value, start, end, index => `${index + 1}. `);

/**
 * `[label](url)`. With a selection, the selected text becomes the label and `url`
 * is left selected for a quick paste. Without one, the cursor lands inside the
 * (empty) label brackets.
 */
export const applyLink = (
  value: string,
  start: number,
  end: number,
): MarkdownFormatResult => {
  const selected = value.slice(start, end);

  if (!selected) {
    const inserted = '[]()';
    const newValue = value.slice(0, start) + inserted + value.slice(end);
    const cursor = start + 1;
    return { value: newValue, selectionStart: cursor, selectionEnd: cursor };
  }

  const url = 'url';
  const newValue = `${value.slice(0, start)}[${selected}](${url})${value.slice(end)}`;
  const urlStart = start + 1 + selected.length + 2;

  return {
    value: newValue,
    selectionStart: urlStart,
    selectionEnd: urlStart + url.length,
  };
};

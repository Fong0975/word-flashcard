import { MarkdownFormatResult } from './markdownFormatting';

/**
 * Marks where the cursor should land after a symbol is inserted, for symbols
 * whose useful cursor position isn't simply "after the inserted text" (e.g.
 * a pair of quotation marks where typing should continue between them).
 */
export const SYMBOL_CURSOR_MARKER = '{{cursor}}';

/**
 * Inserts `symbolValue` at `[start, end)`, replacing any selected text in
 * that range. If `symbolValue` contains `SYMBOL_CURSOR_MARKER`, the marker is
 * stripped and the cursor lands where it was; otherwise the cursor lands
 * right after the inserted text.
 */
export const insertSymbol = (
  value: string,
  start: number,
  end: number,
  symbolValue: string,
): MarkdownFormatResult => {
  const markerIndex = symbolValue.indexOf(SYMBOL_CURSOR_MARKER);
  const insertText =
    markerIndex === -1
      ? symbolValue
      : symbolValue.slice(0, markerIndex) +
        symbolValue.slice(markerIndex + SYMBOL_CURSOR_MARKER.length);

  const newValue = value.slice(0, start) + insertText + value.slice(end);
  const cursor = start + (markerIndex === -1 ? insertText.length : markerIndex);

  return { value: newValue, selectionStart: cursor, selectionEnd: cursor };
};

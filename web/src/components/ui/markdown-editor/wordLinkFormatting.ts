import { MarkdownFormatResult } from './markdownFormatting';

export interface BacktickWordMatch {
  word: string;
  openIndex: number;
  closeIndex: number;
}

/**
 * Detects a backtick pair (e.g. `` `apple` ``) that was just completed by the
 * character immediately before `cursorPosition`. Only fires when that
 * character is itself a closing backtick, so it reacts the instant the pair
 * is finished rather than re-scanning the whole value on every keystroke.
 */
export const detectCompletedBacktickWord = (
  value: string,
  cursorPosition: number,
): BacktickWordMatch | null => {
  const closeIndex = cursorPosition - 1;
  if (value[closeIndex] !== '`') {
    return null;
  }

  const openIndex = value.lastIndexOf('`', closeIndex - 1);
  if (openIndex === -1) {
    return null;
  }

  const content = value.slice(openIndex + 1, closeIndex);
  if (!content.trim() || content.includes('\n')) {
    return null;
  }

  return { word: content.trim(), openIndex, closeIndex };
};

/**
 * Whether a word-link (`([link](/word/...))`) already sits right after
 * `position`, so an existing link isn't duplicated or re-prompted for.
 */
export const hasWordLinkAfter = (value: string, position: number): boolean =>
  /^\(\[link\]\(/.test(value.slice(position));

/**
 * Inserts a `([link](/word/{word}))` markdown link at `position`, leaving
 * the cursor right after the inserted text.
 */
export const insertWordLink = (
  value: string,
  position: number,
  word: string,
): MarkdownFormatResult => {
  const linkText = `([link](/word/${encodeURIComponent(word)}))`;
  const newValue = value.slice(0, position) + linkText + value.slice(position);
  const cursor = position + linkText.length;

  return { value: newValue, selectionStart: cursor, selectionEnd: cursor };
};

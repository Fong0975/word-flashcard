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
 * Scans the entire value for backtick-wrapped words (e.g. `` `apple` ``),
 * returning every valid pair in document order. Unlike
 * `detectCompletedBacktickWord`, this isn't cursor-driven — it's meant for a
 * one-off full-text sweep (e.g. on blur) to catch pairs that were completed
 * without the cursor ever landing right after the closing backtick, such as
 * pasting a word into an existing empty `` ` ` `` pair.
 */
export const findAllBacktickWords = (value: string): BacktickWordMatch[] => {
  const matches: BacktickWordMatch[] = [];
  const pattern = /`([^`\n]*)`/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(value)) !== null) {
    const word = m[1].trim();
    if (!word) {
      continue;
    }
    matches.push({
      word,
      openIndex: m.index,
      closeIndex: m.index + m[0].length - 1,
    });
  }
  return matches;
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

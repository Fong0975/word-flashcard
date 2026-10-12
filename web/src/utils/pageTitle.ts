export const APP_NAME = 'Flashcard';

/** Default display-width budget for the detail part of a page title. */
export const MAX_DETAIL_WIDTH = 40;

/** Tighter budget for details that are free-form prose (question text, note titles). */
export const MAX_SHORT_DETAIL_WIDTH = 25;

/** Detail shown when the entity behind a detail page could not be loaded. */
export const NOT_FOUND_DETAIL = 'Not found';

const DETAIL_SEPARATOR = ' - ';
const APP_NAME_SEPARATOR = ' | ';
const ELLIPSIS = '…';

// Hangul Jamo, CJK ideographs/symbols/kana, Hangul syllables, CJK
// compatibility forms and full-width forms.
const WIDE_CHAR_PATTERN = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/;

export interface PageTitleOptions {
  /** Text placed before the detail (e.g. `#12`); never truncated and not counted against the width budget. */
  detailPrefix?: string | null;
  /** Display-width budget for the detail. Defaults to `MAX_DETAIL_WIDTH`. */
  maxDetailWidth?: number;
}

/**
 * Returns how many half-width columns a character occupies.
 * Astral code points (emoji, CJK extensions) are treated as wide.
 *
 * @param char - A single code point.
 */
const getCharWidth = (char: string): number =>
  (char.codePointAt(0) ?? 0) > 0xffff || WIDE_CHAR_PATTERN.test(char) ? 2 : 1;

const normalizeWhitespace = (text?: string | null): string =>
  (text ?? '').replace(/\s+/g, ' ').trim();

/**
 * Truncates text to a display width, counting full-width/CJK characters as
 * two columns so that CJK and Latin text end up visually the same length.
 * Truncated text ends with an ellipsis that is included in the budget.
 *
 * @param text - Text to truncate.
 * @param maxWidth - Maximum display width in half-width columns.
 * @returns The original text when it fits, otherwise the truncated text.
 */
export const truncateToWidth = (text: string, maxWidth: number): string => {
  // Iterating by code point keeps surrogate pairs intact.
  const chars = Array.from(text);
  const totalWidth = chars.reduce((sum, char) => sum + getCharWidth(char), 0);
  if (totalWidth <= maxWidth) {
    return text;
  }

  const budget = maxWidth - 1;
  let kept = '';
  let width = 0;
  for (const char of chars) {
    const charWidth = getCharWidth(char);
    if (width + charWidth > budget) {
      break;
    }
    kept += char;
    width += charWidth;
  }

  return `${kept.trimEnd()}${ELLIPSIS}`;
};

/**
 * Builds a browser tab title in the form
 * `{pageType} - {detail} | Flashcard`. Empty parts are dropped, and with
 * nothing to show the title is just the app name.
 *
 * @param pageType - Kind of page (e.g. `Word`, `Questions (Page 2)`).
 * @param detail - Most specific content of the page (e.g. the word itself).
 * @param options - Detail prefix and width budget.
 * @returns The formatted document title.
 */
export const formatPageTitle = (
  pageType?: string | null,
  detail?: string | null,
  options: PageTitleOptions = {},
): string => {
  const { detailPrefix, maxDetailWidth = MAX_DETAIL_WIDTH } = options;

  const detailText = [
    normalizeWhitespace(detailPrefix),
    truncateToWidth(normalizeWhitespace(detail), maxDetailWidth),
  ]
    .filter(Boolean)
    .join(' ');

  const pageText = [normalizeWhitespace(pageType), detailText]
    .filter(Boolean)
    .join(DETAIL_SEPARATOR);

  return pageText ? `${pageText}${APP_NAME_SEPARATOR}${APP_NAME}` : APP_NAME;
};

/**
 * Appends the page number to a list page label from the second page onward.
 *
 * @param label - List page label (e.g. `Words`).
 * @param page - 1-based page number.
 * @returns `label` for the first page, otherwise `label (Page N)`.
 */
export const withPageNumber = (label: string, page: number): string =>
  page > 1 ? `${label} (Page ${page})` : label;

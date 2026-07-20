import {
  formatShortDate,
  formatDateTime,
  formatNoteDate,
  formatNoteDateTime,
} from './dateFormat';

// 2026-07-19T17:30:00Z is 2026-07-20 01:30 in Asia/Taipei (UTC+8).
// Deliberately chosen to cross the UTC day boundary so these tests
// actually exercise the timezone conversion, not just formatting.
const CROSS_DAY_ISO = '2026-07-19T17:30:00Z';

// formatShortDate/formatDateTime intentionally use the runtime's default
// locale (only the timezone is pinned), so their punctuation/wording varies
// by environment (e.g. "7/20/2026" vs "2026/7/20"). Compare the numeric
// components instead of the exact string so the test stays locale-agnostic.
const numbersIn = (value: string): string[] =>
  (value.match(/\d+/g) ?? []).sort();

describe('formatShortDate', () => {
  it('renders the date in Asia/Taipei, not the raw UTC date', () => {
    expect(numbersIn(formatShortDate(CROSS_DAY_ISO))).toEqual(
      numbersIn('7/20/2026'),
    );
  });
});

describe('formatDateTime', () => {
  it('renders the date and time in Asia/Taipei', () => {
    expect(numbersIn(formatDateTime(CROSS_DAY_ISO))).toEqual(
      numbersIn('7/20/2026 1:30:00'),
    );
  });
});

describe('formatNoteDate', () => {
  it('returns "-" for a null date', () => {
    expect(formatNoteDate(null)).toBe('-');
  });

  it('renders the date in Asia/Taipei', () => {
    expect(formatNoteDate(CROSS_DAY_ISO)).toBe('Jul 20, 2026');
  });
});

describe('formatNoteDateTime', () => {
  it('returns "-" for a null date', () => {
    expect(formatNoteDateTime(null)).toBe('-');
  });

  it('renders the date and time in Asia/Taipei', () => {
    expect(formatNoteDateTime(CROSS_DAY_ISO)).toMatch(
      /^Jul 20, 2026,\s+01:30\s+AM$/,
    );
  });
});

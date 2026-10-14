// @vitest-environment node

import {
  formatShortDate,
  formatDateTimeParts,
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

describe('formatDateTimeParts', () => {
  it.each([
    {
      name: 'splits a time after midnight in Asia/Taipei',
      iso: CROSS_DAY_ISO,
      date: '7/20/2026',
      time: '01:30',
    },
    {
      name: 'renders half past midnight as 00, not 24',
      iso: '2026-07-19T16:30:00Z',
      date: '7/20/2026',
      time: '00:30',
    },
    {
      name: 'renders an afternoon time in 24-hour format',
      iso: '2026-07-20T07:05:00Z',
      date: '7/20/2026',
      time: '15:05',
    },
  ])('$name', ({ iso, date, time }) => {
    const parts = formatDateTimeParts(iso);
    expect(numbersIn(parts.date)).toEqual(numbersIn(date));
    expect(parts.time).toBe(time);
  });
});

describe('formatDateTime', () => {
  it.each([
    { iso: CROSS_DAY_ISO, time: '01:30' },
    { iso: '2026-07-20T07:05:00Z', time: '15:05' },
  ])(
    'renders $iso as one line ending in the 24-hour time $time',
    ({ iso, time }) => {
      const value = formatDateTime(iso);
      expect(value.endsWith(` ${time}`)).toBe(true);
      expect(numbersIn(value)).toEqual(numbersIn(`7/20/2026 ${time}`));
      expect(value).not.toMatch(/AM|PM|上午|下午/i);
    },
  );
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

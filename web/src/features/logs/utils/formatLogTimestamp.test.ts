import { formatLogTimestamp } from './formatLogTimestamp';

describe('formatLogTimestamp', () => {
  it.each([
    {
      name: 'formats a local-time timestamp',
      // Constructed from parts so the expectation holds in any timezone.
      input: new Date(2026, 7, 30, 20, 44, 13).toISOString(),
      expected: '2026-08-30 20:44:13',
    },
    {
      name: 'zero-pads single-digit parts',
      input: new Date(2026, 0, 5, 9, 8, 7).toISOString(),
      expected: '2026-01-05 09:08:07',
    },
    {
      name: 'returns an unparsable value unchanged instead of "Invalid Date"',
      input: 'not a timestamp',
      expected: 'not a timestamp',
    },
    {
      name: 'returns an empty string unchanged',
      input: '',
      expected: '',
    },
  ])('$name', ({ input, expected }) => {
    expect(formatLogTimestamp(input)).toBe(expected);
  });
});

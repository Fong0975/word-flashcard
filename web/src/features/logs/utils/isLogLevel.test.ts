import { isLogLevel } from './isLogLevel';

describe('isLogLevel', () => {
  it.each([
    { value: 'DEBUG', expected: true },
    { value: 'INFO', expected: true },
    { value: 'WARN', expected: true },
    { value: 'ERROR', expected: true },
    { value: 'warn', expected: false },
    { value: 'TRACE', expected: false },
    { value: 'familiarity:red', expected: false },
    { value: '', expected: false },
  ])('returns $expected for "$value"', ({ value, expected }) => {
    expect(isLogLevel(value)).toBe(expected);
  });
});

import {
  getAccuracyRateColor,
  getAccuracyTextColor,
  getAccuracyTone,
  getAccuracyToneClass,
  getScoreColor,
} from './quiz';

describe('getAccuracyTone', () => {
  it.each([
    { rate: 100, expected: 'green' },
    { rate: 80, expected: 'green' },
    { rate: 79, expected: 'yellow' },
    { rate: 60, expected: 'yellow' },
    { rate: 59, expected: 'red' },
    { rate: 0, expected: 'red' },
  ])('maps $rate% to $expected', ({ rate, expected }) => {
    expect(getAccuracyTone(rate)).toBe(expected);
  });
});

describe('getAccuracyRateColor', () => {
  it.each([
    {
      rate: 80,
      expected:
        'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    },
    {
      rate: 60,
      expected:
        'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      rate: 59,
      expected: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    },
  ])('returns the badge colors for $rate%', ({ rate, expected }) => {
    expect(getAccuracyRateColor(rate)).toBe(expected);
  });
});

describe('getScoreColor', () => {
  it.each([
    { percentage: 80, expected: 'text-green-600 dark:text-green-400' },
    { percentage: 60, expected: 'text-yellow-600 dark:text-yellow-400' },
    { percentage: 59, expected: 'text-red-600 dark:text-red-400' },
  ])('returns the score color for $percentage%', ({ percentage, expected }) => {
    expect(getScoreColor(percentage)).toBe(expected);
  });
});

describe('getAccuracyTextColor', () => {
  it.each([
    { rate: 80, expected: 'text-green-700 dark:text-green-400' },
    { rate: 60, expected: 'text-yellow-700 dark:text-yellow-400' },
    { rate: 59, expected: 'text-red-700 dark:text-red-400' },
  ])('returns the text color for $rate%', ({ rate, expected }) => {
    expect(getAccuracyTextColor(rate)).toBe(expected);
  });
});

describe('getAccuracyToneClass', () => {
  it.each([
    { rate: 80, expected: 'glass-glow-green' },
    { rate: 60, expected: 'glass-glow-yellow' },
    { rate: 59, expected: 'glass-glow-red' },
  ])('returns the glow tone class for $rate%', ({ rate, expected }) => {
    expect(getAccuracyToneClass(rate)).toBe(expected);
  });
});

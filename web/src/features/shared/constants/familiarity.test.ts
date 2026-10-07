// @vitest-environment node

import { FamiliarityLevel } from '../../../types/base';

import {
  FAMILIARITY_LABELS,
  FAMILIARITY_OPTIONS,
  getFamiliarityDisplayColors,
  getFamiliarityGlowClass,
  getFamiliarityLabel,
  getFamiliarityToneClass,
} from './familiarity';

describe('FAMILIARITY_LABELS', () => {
  it.each([
    [FamiliarityLevel.RED, 'Unfamiliar'],
    [FamiliarityLevel.YELLOW, 'Learning'],
    [FamiliarityLevel.GREEN, 'Familiar'],
  ] as const)('labels %s as %s', (familiarity, expected) => {
    expect(FAMILIARITY_LABELS[familiarity]).toBe(expected);
  });
});

describe('getFamiliarityLabel', () => {
  it.each([
    [FamiliarityLevel.RED, FAMILIARITY_LABELS[FamiliarityLevel.RED]],
    [FamiliarityLevel.YELLOW, FAMILIARITY_LABELS[FamiliarityLevel.YELLOW]],
    [FamiliarityLevel.GREEN, FAMILIARITY_LABELS[FamiliarityLevel.GREEN]],
    ['invalid', 'invalid'],
    ['', ''],
  ] as const)('returns %s -> %s', (familiarity, expected) => {
    expect(getFamiliarityLabel(familiarity)).toBe(expected);
  });
});

describe('FAMILIARITY_OPTIONS', () => {
  it.each(FAMILIARITY_OPTIONS.map(option => [option.value, option.label]))(
    'labels the %s option with its shared label',
    (value, label) => {
      expect(label).toBe(FAMILIARITY_LABELS[value]);
    },
  );
});

describe('getFamiliarityToneClass', () => {
  it.each([
    [FamiliarityLevel.GREEN, 'glass-glow-green'],
    [FamiliarityLevel.YELLOW, 'glass-glow-yellow'],
    [FamiliarityLevel.RED, 'glass-glow-red'],
    ['invalid', ''],
  ] as const)('returns %s -> %s', (familiarity, expected) => {
    expect(getFamiliarityToneClass(familiarity)).toBe(expected);
  });
});

describe('getFamiliarityGlowClass', () => {
  it.each([
    [FamiliarityLevel.GREEN, 'glass-glow glass-glow-green'],
    [FamiliarityLevel.YELLOW, 'glass-glow glass-glow-yellow'],
    [FamiliarityLevel.RED, 'glass-glow glass-glow-red'],
    ['invalid', ''],
  ] as const)('returns %s -> %s', (familiarity, expected) => {
    expect(getFamiliarityGlowClass(familiarity)).toBe(expected);
  });
});

describe('getFamiliarityDisplayColors', () => {
  it.each([
    [
      FamiliarityLevel.GREEN,
      {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-200',
        dot: 'bg-green-500',
      },
    ],
    [
      FamiliarityLevel.YELLOW,
      {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-200',
        dot: 'bg-yellow-500',
      },
    ],
    [
      FamiliarityLevel.RED,
      {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        dot: 'bg-red-500',
      },
    ],
    [
      'invalid',
      {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-800 dark:text-gray-200',
        dot: 'bg-gray-500',
      },
    ],
  ] as const)('returns the expected colors for %s', (familiarity, expected) => {
    expect(getFamiliarityDisplayColors(familiarity)).toEqual(expected);
  });
});

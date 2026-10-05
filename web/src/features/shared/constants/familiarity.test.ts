// @vitest-environment node

import { FamiliarityLevel } from '../../../types/base';

import {
  getFamiliarityDisplayColors,
  getFamiliarityGlowClass,
  getFamiliarityToneClass,
} from './familiarity';

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

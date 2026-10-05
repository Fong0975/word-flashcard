/**
 * Familiarity level constants and utilities
 * Used across Words and Quiz components
 */

import { FamiliarityLevel } from '../../../types/base';
import { SelectOption } from '../../../types';

// Re-export enum from base types
export { FamiliarityLevel } from '../../../types/base';

/**
 * Familiarity option interface for UI components
 */
export interface FamiliarityOption extends SelectOption<FamiliarityLevel> {
  readonly color: string;
  readonly bgColor: string;
}

/**
 * Predefined familiarity options for use in forms and displays
 */
export const FAMILIARITY_OPTIONS: readonly FamiliarityOption[] = [
  {
    value: FamiliarityLevel.GREEN,
    label: 'Green',
    color: 'text-green-600 dark:text-green-400',
    bgColor:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    description: 'Well-known words that you can recall easily',
  },
  {
    value: FamiliarityLevel.YELLOW,
    label: 'Yellow',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor:
      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
    description: 'Somewhat familiar words that need occasional review',
  },
  {
    value: FamiliarityLevel.RED,
    label: 'Red',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
    description: 'Difficult words that require frequent practice',
  },
] as const;

/**
 * Get the tone class that sets the glow hue (`--glass-glow`) for a familiarity
 * level. Pair it with `.glass-glow` or `.glass-glow-bar`.
 *
 * @param familiarity - Familiarity level to visualize
 * @returns The `.glass-glow-*` tone class, or an empty string for an unknown level
 */
export const getFamiliarityToneClass = (
  familiarity: FamiliarityLevel | string,
): string => {
  const level = familiarity as FamiliarityLevel;
  switch (level) {
    case FamiliarityLevel.GREEN:
      return 'glass-glow-green';
    case FamiliarityLevel.YELLOW:
      return 'glass-glow-yellow';
    case FamiliarityLevel.RED:
      return 'glass-glow-red';
    default:
      return '';
  }
};

/**
 * Get the glass rim-light classes that tint a `.glass-panel` edge with the
 * familiarity color.
 *
 * @param familiarity - Familiarity level to visualize
 * @returns The `.glass-glow` class pair, or an empty string for an unknown level
 */
export const getFamiliarityGlowClass = (
  familiarity: FamiliarityLevel | string,
): string => {
  const toneClass = getFamiliarityToneClass(familiarity);
  return toneClass ? `glass-glow ${toneClass}` : '';
};

/**
 * Get familiarity text and background colors for results display
 */
export const getFamiliarityDisplayColors = (
  familiarity: FamiliarityLevel | string,
) => {
  const level = familiarity as FamiliarityLevel;
  switch (level) {
    case FamiliarityLevel.GREEN:
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-200',
        dot: 'bg-green-500',
      } as const;
    case FamiliarityLevel.YELLOW:
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-200',
        dot: 'bg-yellow-500',
      } as const;
    case FamiliarityLevel.RED:
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        dot: 'bg-red-500',
      } as const;
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-800 dark:text-gray-200',
        dot: 'bg-gray-500',
      } as const;
  }
};

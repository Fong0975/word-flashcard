import React from 'react';

import { getAccuracyToneClass } from '../shared/constants/quiz';

interface AccuracyBarProps {
  /** Accuracy percentage (0-100), or `null` when never practiced. */
  accuracyRate: number | null;
  /** Position, size and rounding utilities for this usage. */
  className?: string;
}

/**
 * Glass bar that glows in the accuracy tone color; never practiced falls back
 * to the neutral gray of `.glass-glow-bar`. Decorative: the rate must also be
 * shown as text nearby.
 */
export const AccuracyBar: React.FC<AccuracyBarProps> = ({
  accuracyRate,
  className,
}) => {
  const classNames = [
    'glass-glow-bar',
    accuracyRate === null ? '' : getAccuracyToneClass(accuracyRate),
    className,
  ].filter(Boolean);

  return (
    <div
      data-testid='accuracy-bar'
      aria-hidden='true'
      className={classNames.join(' ')}
    />
  );
};

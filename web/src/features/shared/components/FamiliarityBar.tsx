import React from 'react';

import { getFamiliarityToneClass } from '../constants/familiarity';

interface FamiliarityBarProps {
  familiarity: string;
  /**
   * `horizontal` (default) is a centered bar under a heading; `vertical` is a
   * band at the start of a flex row.
   */
  orientation?: 'horizontal' | 'vertical';
  /** Size and spacing utilities for this usage, e.g. `mb-4 w-24`. */
  className?: string;
}

/**
 * Glass bar that glows in the familiarity color. An unknown level falls back
 * to the neutral gray of `.glass-glow-bar`.
 */
export const FamiliarityBar: React.FC<FamiliarityBarProps> = ({
  familiarity,
  orientation = 'horizontal',
  className,
}) => {
  if (!familiarity) {
    return null;
  }

  const classNames = [
    'glass-glow-bar',
    orientation === 'vertical' ? 'flex-shrink-0' : 'mx-auto',
    getFamiliarityToneClass(familiarity),
    className,
  ].filter(Boolean);

  return <div data-testid='familiarity-bar' className={classNames.join(' ')} />;
};

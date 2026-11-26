import React from 'react';

import {
  AccuracyTone,
  getScoreBadgeColor,
  getScoreColor,
} from '../constants/quiz';

interface QuizScoreHeroProps {
  /** Score percentage (0-100). */
  percentage: number;
  /** Color tone of both elements; each quiz type has its own thresholds. */
  tone: AccuracyTone;
  /** Accessible name of the percentage, for when `caption` does not name it. */
  percentageLabel?: string;
  /** Short text shown in the capsule under the percentage. */
  caption: string;
}

/**
 * Headline of a quiz result summary: a large percentage with a capsule below it.
 */
export const QuizScoreHero: React.FC<QuizScoreHeroProps> = ({
  percentage,
  tone,
  percentageLabel,
  caption,
}) => (
  <div className='text-center'>
    <div
      aria-label={percentageLabel}
      className={`mb-4 text-6xl font-bold ${getScoreColor(tone)}`}
    >
      {percentage}%
    </div>
    <div
      className={`inline-flex items-center rounded-full border px-4 py-2 font-semibold md:text-lg ${getScoreBadgeColor(tone)}`}
    >
      {caption}
    </div>
  </div>
);

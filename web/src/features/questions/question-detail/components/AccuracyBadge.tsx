import React from 'react';

import { AccuracyBadgeProps } from '../types/question-detail';
import { getAccuracyRateColor } from '../utils/accuracyCalculation';

export const AccuracyBadge: React.FC<AccuracyBadgeProps> = ({
  accuracyRate,
}) => {
  const colorClass = getAccuracyRateColor(accuracyRate);

  return (
    <div className='col-span-2'>
      <div
        className={`rounded-full px-3 py-2 text-center text-sm font-medium ${colorClass}`}
      >
        Accuracy Rate: {accuracyRate}%
      </div>
    </div>
  );
};

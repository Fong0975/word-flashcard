import React from 'react';
import { AccuracyBadgeProps } from '../types/question-detail';
import { getAccuracyRateColor } from '../utils/accuracyCalculation';

export const AccuracyBadge: React.FC<AccuracyBadgeProps> = ({ accuracyRate }) => {
  const colorClass = getAccuracyRateColor(accuracyRate);

  return (
    <div className="col-span-2">
      <div className={`text-sm px-3 py-2 rounded-full font-medium text-center ${colorClass}`}>
        Accuracy Rate: {accuracyRate}%
      </div>
    </div>
  );
};
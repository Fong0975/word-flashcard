import React from 'react';
import { PracticeStatsProps } from '../types/question-detail';
import { AccuracyBadge } from './AccuracyBadge';

export const PracticeStats: React.FC<PracticeStatsProps> = ({
  practiceCount,
  failureCount,
  accuracyRate
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Practice Statistics
      </h2>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Practices</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {practiceCount}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {failureCount}
            </div>
          </div>
          {practiceCount > 0 && (
            <AccuracyBadge accuracyRate={accuracyRate} />
          )}
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { ReferenceSectionProps } from '../types/question-detail';

export const ReferenceSection: React.FC<ReferenceSectionProps> = ({ reference }) => {
  if (!reference) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Reference
      </h2>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-gray-700 dark:text-gray-300 text-sm">
          {reference}
        </p>
      </div>
    </div>
  );
};
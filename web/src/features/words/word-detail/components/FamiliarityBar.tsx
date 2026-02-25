import React from 'react';
import { FamiliarityBarProps } from '../types/word-detail';
import { getFamiliarityBarColor } from '../utils/familiarity';

export const FamiliarityBar: React.FC<FamiliarityBarProps> = ({ familiarity }) => {
  if (!familiarity) {
    return null;
  }

  return (
    <div className="text-center mb-4">
      <div
        className={`w-24 h-2 rounded-full transition-colors duration-300 mx-auto ${getFamiliarityBarColor(familiarity)}`}
      />
    </div>
  );
};
import React from 'react';

import { FamiliarityBarProps } from '../types/word-detail';
import { getFamiliarityColor } from '../../../shared/constants/familiarity';

export const FamiliarityBar: React.FC<FamiliarityBarProps> = ({
  familiarity,
}) => {
  if (!familiarity) {
    return null;
  }

  return (
    <div className='mb-4 text-center'>
      <div
        className={`mx-auto h-2 w-24 rounded-full transition-colors duration-300 ${getFamiliarityColor(familiarity)}`}
      />
    </div>
  );
};

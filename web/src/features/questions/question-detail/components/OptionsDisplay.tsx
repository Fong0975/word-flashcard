import React from 'react';

import { OptionsDisplayProps } from '../types/question-detail';

import { OptionItem } from './OptionItem';

export const OptionsDisplay: React.FC<OptionsDisplayProps> = ({ options }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Options
      </h2>
      <div className="space-y-3">
        {options.map((option) => (
          <OptionItem key={option.key} option={option} />
        ))}
      </div>
    </div>
  );
};
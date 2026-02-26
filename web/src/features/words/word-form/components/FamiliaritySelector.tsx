import React from 'react';

import { FamiliarityLevel } from '../../../../types/base';
import { FAMILIARITY_OPTIONS } from '../utils/constants';

interface FamiliaritySelectorProps {
  value: FamiliarityLevel;
  onChange: (familiarity: FamiliarityLevel) => void;
  disabled: boolean;
  mode: 'create' | 'edit';
}

export const FamiliaritySelector: React.FC<FamiliaritySelectorProps> = ({
  value,
  onChange,
  disabled,
  mode,
}) => {
  // Only show in edit mode
  if (mode !== 'edit') {
    return null;
  }

  return (
    <div>
      <label htmlFor="familiarity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Familiarity Level
      </label>
      <select
        id="familiarity"
        value={value}
        onChange={(e) => onChange(e.target.value as FamiliarityLevel)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
        disabled={disabled}
      >
        {FAMILIARITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Choose your familiarity level with this word
      </p>
    </div>
  );
};
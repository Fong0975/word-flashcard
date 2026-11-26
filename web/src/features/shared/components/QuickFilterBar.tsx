import React from 'react';

import { QuickFilterButton } from './QuickFilterButton';

export interface QuickFilterOption {
  key: string;
  label: string;
  dotClassName?: string;
}

interface QuickFilterBarProps {
  filters: readonly QuickFilterOption[];
  activeFilters: readonly string[];
  onToggle: (key: string) => void;
}

/**
 * The row of toggleable quick filters shown under a review list's search bar.
 */
export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  filters,
  activeFilters,
  onToggle,
}) => (
  <div className='flex flex-wrap items-center gap-2'>
    <span className='text-sm text-gray-500 dark:text-gray-400'>Filters:</span>
    {filters.map(filter => (
      <QuickFilterButton
        key={filter.key}
        label={filter.label}
        isActive={activeFilters.includes(filter.key)}
        onClick={() => onToggle(filter.key)}
        dotClassName={filter.dotClassName}
      />
    ))}
  </div>
);

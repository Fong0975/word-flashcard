import { useState } from 'react';

import { FamiliarityLevel } from '../constants';

interface UseCategoryCountsReturn {
  categoryCounts: Record<FamiliarityLevel, number>;
  categoryInputs: Record<FamiliarityLevel, string>;
  handleCategoryCountChange: (level: FamiliarityLevel, value: string) => void;
  categoryModeAllZero: boolean;
  reset: () => void;
}

const defaultCategoryCounts = (): Record<FamiliarityLevel, number> => ({
  [FamiliarityLevel.RED]: 7,
  [FamiliarityLevel.YELLOW]: 5,
  [FamiliarityLevel.GREEN]: 3,
});

const defaultCategoryInputs = (): Record<FamiliarityLevel, string> => ({
  [FamiliarityLevel.RED]: '7',
  [FamiliarityLevel.YELLOW]: '5',
  [FamiliarityLevel.GREEN]: '3',
});

/**
 * Tracks the per-familiarity-category word counts for "by category" quiz
 * setup, as both validated numbers and their raw text inputs.
 */
export const useCategoryCounts = (
  maxCount: number,
): UseCategoryCountsReturn => {
  const [categoryCounts, setCategoryCounts] = useState<
    Record<FamiliarityLevel, number>
  >(defaultCategoryCounts());
  const [categoryInputs, setCategoryInputs] = useState<
    Record<FamiliarityLevel, string>
  >(defaultCategoryInputs());

  const handleCategoryCountChange = (
    level: FamiliarityLevel,
    value: string,
  ) => {
    setCategoryInputs(prev => ({ ...prev, [level]: value }));
    const num = parseInt(value, 10);
    const clamped = isNaN(num) || num < 0 ? 0 : Math.min(num, maxCount);
    setCategoryCounts(prev => ({ ...prev, [level]: clamped }));
  };

  const reset = () => {
    setCategoryCounts(defaultCategoryCounts());
    setCategoryInputs(defaultCategoryInputs());
  };

  const categoryModeAllZero = Object.values(categoryCounts).every(v => v === 0);

  return {
    categoryCounts,
    categoryInputs,
    handleCategoryCountChange,
    categoryModeAllZero,
    reset,
  };
};

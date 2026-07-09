import { renderHook, act } from '@testing-library/react';

import { FamiliarityLevel } from '../../../types/base';

import { useCategoryCounts } from './useCategoryCounts';

describe('useCategoryCounts', () => {
  it('starts with the default counts and inputs', () => {
    const { result } = renderHook(() => useCategoryCounts(20));

    expect(result.current.categoryCounts).toEqual({
      [FamiliarityLevel.RED]: 7,
      [FamiliarityLevel.YELLOW]: 5,
      [FamiliarityLevel.GREEN]: 3,
    });
    expect(result.current.categoryInputs).toEqual({
      [FamiliarityLevel.RED]: '7',
      [FamiliarityLevel.YELLOW]: '5',
      [FamiliarityLevel.GREEN]: '3',
    });
    expect(result.current.categoryModeAllZero).toBe(false);
  });

  it('updates the count and raw input for a category', () => {
    const { result } = renderHook(() => useCategoryCounts(20));

    act(() => {
      result.current.handleCategoryCountChange(FamiliarityLevel.RED, '10');
    });

    expect(result.current.categoryCounts[FamiliarityLevel.RED]).toBe(10);
    expect(result.current.categoryInputs[FamiliarityLevel.RED]).toBe('10');
  });

  it('clamps a value above maxCount', () => {
    const { result } = renderHook(() => useCategoryCounts(20));

    act(() => {
      result.current.handleCategoryCountChange(FamiliarityLevel.RED, '999');
    });

    expect(result.current.categoryCounts[FamiliarityLevel.RED]).toBe(20);
    expect(result.current.categoryInputs[FamiliarityLevel.RED]).toBe('999');
  });

  it('clamps a negative value to zero', () => {
    const { result } = renderHook(() => useCategoryCounts(20));

    act(() => {
      result.current.handleCategoryCountChange(FamiliarityLevel.RED, '-5');
    });

    expect(result.current.categoryCounts[FamiliarityLevel.RED]).toBe(0);
  });

  it('treats a non-numeric value as zero', () => {
    const { result } = renderHook(() => useCategoryCounts(20));

    act(() => {
      result.current.handleCategoryCountChange(FamiliarityLevel.RED, 'abc');
    });

    expect(result.current.categoryCounts[FamiliarityLevel.RED]).toBe(0);
    expect(result.current.categoryInputs[FamiliarityLevel.RED]).toBe('abc');
  });

  it('reports categoryModeAllZero once every category is zero', () => {
    const { result } = renderHook(() => useCategoryCounts(20));

    act(() => {
      result.current.handleCategoryCountChange(FamiliarityLevel.RED, '0');
      result.current.handleCategoryCountChange(FamiliarityLevel.YELLOW, '0');
      result.current.handleCategoryCountChange(FamiliarityLevel.GREEN, '0');
    });

    expect(result.current.categoryModeAllZero).toBe(true);
  });

  it('reset restores the default counts and inputs', () => {
    const { result } = renderHook(() => useCategoryCounts(20));

    act(() => {
      result.current.handleCategoryCountChange(FamiliarityLevel.RED, '10');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.categoryCounts[FamiliarityLevel.RED]).toBe(7);
    expect(result.current.categoryInputs[FamiliarityLevel.RED]).toBe('7');
  });
});

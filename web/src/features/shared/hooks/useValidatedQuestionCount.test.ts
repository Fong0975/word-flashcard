import { renderHook, act } from '@testing-library/react';

import { useValidatedQuestionCount } from './useValidatedQuestionCount';

describe('useValidatedQuestionCount', () => {
  it('starts with the default count, its string form, and no error', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 1, 50));
    expect(result.current.questionCount).toBe(10);
    expect(result.current.questionCountInput).toBe('10');
    expect(result.current.questionCountError).toBe('');
  });

  it('reports an error and zeroes the count for an empty input', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 1, 50));

    act(() => {
      result.current.handleQuestionCountChange('   ');
    });

    expect(result.current.questionCountError).toBe(
      'Please enter a number of questions.',
    );
    expect(result.current.questionCount).toBe(0);
    expect(result.current.questionCountInput).toBe('   ');
  });

  it('reports an error and zeroes the count for a non-numeric input', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 1, 50));

    act(() => {
      result.current.handleQuestionCountChange('abc');
    });

    expect(result.current.questionCountError).toBe(
      'Please enter a valid number.',
    );
    expect(result.current.questionCount).toBe(0);
  });

  it('reports a below-minimum error without clamping the stored count', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 5, 50));

    act(() => {
      result.current.handleQuestionCountChange('2');
    });

    expect(result.current.questionCountError).toBe(
      'Number of questions must be at least 5.',
    );
    expect(result.current.questionCount).toBe(2);
  });

  it('reports an above-maximum error without clamping the stored count', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 1, 20));

    act(() => {
      result.current.handleQuestionCountChange('99');
    });

    expect(result.current.questionCountError).toBe(
      'Number of questions cannot exceed 20.',
    );
    expect(result.current.questionCount).toBe(99);
  });

  it('accepts a valid value within range with no error', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 1, 50));

    act(() => {
      result.current.handleQuestionCountChange('25');
    });

    expect(result.current.questionCountError).toBe('');
    expect(result.current.questionCount).toBe(25);
  });

  it('setQuestionCountInput updates the raw input without validating', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 1, 50));

    act(() => {
      result.current.setQuestionCountInput('abc');
    });

    expect(result.current.questionCountInput).toBe('abc');
    expect(result.current.questionCount).toBe(10);
    expect(result.current.questionCountError).toBe('');
  });

  it('reset restores the default count, input, and clears errors', () => {
    const { result } = renderHook(() => useValidatedQuestionCount(10, 1, 50));

    act(() => {
      result.current.handleQuestionCountChange('abc');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.questionCount).toBe(10);
    expect(result.current.questionCountInput).toBe('10');
    expect(result.current.questionCountError).toBe('');
  });
});

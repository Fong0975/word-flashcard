import { renderHook } from '@testing-library/react';

import { Question } from '../../../../types/api';

import { useQuestionStats } from './useQuestionStats';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 10,
  notes: '',
  reference: '',
  ...overrides,
});

describe('useQuestionStats', () => {
  it('returns zeroed defaults when there is no question', () => {
    const { result } = renderHook(() => useQuestionStats({ question: null }));

    expect(result.current).toEqual({
      accuracyRate: 0,
      accuracyRateColor: '',
      availableOptions: [],
      formattedQuestionText: '',
    });
  });

  it('derives stats from the question', () => {
    const question = buildQuestion({
      count_practise: 10,
      count_failure_practise: 2,
    });
    const { result } = renderHook(() => useQuestionStats({ question }));

    expect(result.current.accuracyRate).toBe(80);
    expect(result.current.accuracyRateColor).toContain('green');
    expect(result.current.availableOptions).toEqual([
      { key: 'A', value: '4' },
      { key: 'B', value: '3' },
      { key: 'C', value: '5' },
      { key: 'D', value: '6' },
    ]);
    expect(result.current.formattedQuestionText).toBe(
      'What is 2 + 2?\nA. 4\nB. 3\nC. 5\nD. 6',
    );
  });

  it('uses a lower-tier color for a low accuracy rate', () => {
    const question = buildQuestion({
      count_practise: 10,
      count_failure_practise: 9,
    });
    const { result } = renderHook(() => useQuestionStats({ question }));

    expect(result.current.accuracyRate).toBe(10);
    expect(result.current.accuracyRateColor).toContain('red');
  });
});

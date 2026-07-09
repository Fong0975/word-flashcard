import { renderHook } from '@testing-library/react';

import { Question } from '../../../../types/api';

import { useShuffledOptions } from './useShuffledOptions';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

describe('useShuffledOptions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('relabels the shuffled options and tracks the new position of the correct answer', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const question = buildQuestion();
    const { result } = renderHook(() => useShuffledOptions(question));

    expect(result.current.shuffledOptions).toEqual([
      { key: 'A', value: '3' },
      { key: 'B', value: '5' },
      { key: 'C', value: '6' },
      { key: 'D', value: '4' },
    ]);
    expect(result.current.shuffledAnswer).toBe('D');
  });

  it('keeps the same labels and answer when the shuffle is a no-op', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999999);
    const question = buildQuestion();
    const { result } = renderHook(() => useShuffledOptions(question));

    expect(result.current.shuffledOptions).toEqual([
      { key: 'A', value: '4' },
      { key: 'B', value: '3' },
      { key: 'C', value: '5' },
      { key: 'D', value: '6' },
    ]);
    expect(result.current.shuffledAnswer).toBe('A');
  });

  it('re-shuffles when the question changes', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999999);
    const first = buildQuestion({ id: 1 });
    const { result, rerender } = renderHook(
      ({ question }: { question: Question }) => useShuffledOptions(question),
      { initialProps: { question: first } },
    );
    expect(result.current.shuffledAnswer).toBe('A');

    jest.spyOn(Math, 'random').mockReturnValue(0);
    const second = buildQuestion({ id: 2, answer: 'B' });
    rerender({ question: second });

    expect(result.current.shuffledAnswer).toBe('A');
  });
});

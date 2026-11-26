import type { Mock } from 'vitest';

import { Question } from '../../../types/api';

import type { NextActionProps } from './QuestionQuiz';

export const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
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
  reminder: null,
  ...overrides,
});

export const noop = () => {};

/** The footer action most recently reported to the `onNextAction` spy. */
export const lastNextAction = (spy: Mock): NextActionProps | null => {
  const { calls } = spy.mock;
  return calls.length > 0 ? calls[calls.length - 1][0] : null;
};

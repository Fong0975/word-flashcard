import { Question } from '../../../../types/api';

import { getAvailableOptions } from './optionHelpers';

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

describe('getAvailableOptions', () => {
  it('returns all four options in order when all are present', () => {
    expect(getAvailableOptions(buildQuestion())).toEqual([
      { key: 'A', value: '4' },
      { key: 'B', value: '3' },
      { key: 'C', value: '5' },
      { key: 'D', value: '6' },
    ]);
  });

  it('omits options that are undefined', () => {
    const question = buildQuestion({
      option_c: undefined,
      option_d: undefined,
    });
    expect(getAvailableOptions(question)).toEqual([
      { key: 'A', value: '4' },
      { key: 'B', value: '3' },
    ]);
  });

  it('returns only option A when the others are absent', () => {
    const question = buildQuestion({
      option_b: undefined,
      option_c: undefined,
      option_d: undefined,
    });
    expect(getAvailableOptions(question)).toEqual([{ key: 'A', value: '4' }]);
  });

  it('omits an option that is an empty string', () => {
    const question = buildQuestion({ option_b: '' });
    expect(getAvailableOptions(question)).toEqual([
      { key: 'A', value: '4' },
      { key: 'C', value: '5' },
      { key: 'D', value: '6' },
    ]);
  });
});

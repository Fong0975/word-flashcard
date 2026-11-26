import { formatAccuracyWithCount } from './formatAccuracy';

describe('formatAccuracyWithCount', () => {
  it.each([
    { name: 'never answered', practise: 0, failure: 0, expected: 'N/A' },
    { name: 'all correct', practise: 2, failure: 0, expected: '100% (2/2)' },
    { name: 'partly correct', practise: 4, failure: 1, expected: '75% (3/4)' },
    { name: 'all wrong', practise: 3, failure: 3, expected: '0% (0/3)' },
  ])('formats a question that is $name', ({ practise, failure, expected }) => {
    expect(formatAccuracyWithCount(practise, failure)).toBe(expected);
  });
});

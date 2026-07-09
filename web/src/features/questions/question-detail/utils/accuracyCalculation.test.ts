import { calculateAccuracyRate } from './accuracyCalculation';

describe('calculateAccuracyRate', () => {
  it('returns 0 when practiceCount is 0', () => {
    expect(calculateAccuracyRate(0, 0)).toBe(0);
  });

  it('returns 100 when there are no failures', () => {
    expect(calculateAccuracyRate(10, 0)).toBe(100);
  });

  it('returns 0 when every attempt failed', () => {
    expect(calculateAccuracyRate(10, 10)).toBe(0);
  });

  it('rounds to the nearest whole percentage', () => {
    // 2/3 successes = 66.66...% -> rounds to 67
    expect(calculateAccuracyRate(3, 1)).toBe(67);
  });

  it('rounds down when the fractional part is below .5', () => {
    // 1/3 successes = 33.33...% -> rounds to 33
    expect(calculateAccuracyRate(3, 2)).toBe(33);
  });
});

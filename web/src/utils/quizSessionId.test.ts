import { generateQuizSessionId } from './quizSessionId';

describe('generateQuizSessionId', () => {
  const tests = [
    {
      name: 'uses crypto.randomUUID when available',
      cryptoImpl: { randomUUID: () => 'fixed-uuid-value' },
    },
    {
      name: 'falls back to a generated id when crypto.randomUUID is unavailable',
      cryptoImpl: {},
    },
    {
      name: 'falls back to a generated id when crypto is undefined',
      cryptoImpl: undefined,
    },
  ];

  for (const tt of tests) {
    it(`${tt.name}`, () => {
      const id = generateQuizSessionId(tt.cryptoImpl);

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(id.length).toBeLessThanOrEqual(36);
    });
  }

  it('returns the value from crypto.randomUUID verbatim when available', () => {
    expect(
      generateQuizSessionId({ randomUUID: () => 'fixed-uuid-value' }),
    ).toBe('fixed-uuid-value');
  });

  it('generates a unique id on every call', () => {
    // Uniqueness is guaranteed by the internal call counter, so this
    // doesn't depend on Math.random() entropy.
    const ids = new Set(
      Array.from({ length: 20 }, () => generateQuizSessionId({})),
    );

    expect(ids.size).toBe(20);
  });
});

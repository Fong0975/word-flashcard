import { shuffleArray } from './shuffle';

describe('shuffleArray', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an array with the same length', () => {
    expect(shuffleArray([1, 2, 3, 4, 5])).toHaveLength(5);
  });

  it('returns an array containing exactly the same elements', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);
    expect([...shuffled].sort()).toEqual([...original].sort());
  });

  it('does not mutate the original array', () => {
    const original = [1, 2, 3, 4, 5];
    shuffleArray(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns an empty array unchanged', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(shuffleArray(['only'])).toEqual(['only']);
  });

  it('produces the expected permutation for a fixed random sequence', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(shuffleArray([1, 2, 3, 4, 5])).toEqual([2, 3, 4, 5, 1]);
  });

  it('leaves the array unchanged when random always picks the current index', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999999);
    expect(shuffleArray([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });
});

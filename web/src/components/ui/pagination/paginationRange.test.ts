import { generatePageOptions, getPageNumbers } from './paginationRange';

describe('generatePageOptions', () => {
  it('returns a sequential list from 1 to totalPages', () => {
    expect(generatePageOptions(5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns a single-item list when totalPages is 1', () => {
    expect(generatePageOptions(1)).toEqual([1]);
  });

  it('returns an empty list when totalPages is 0', () => {
    expect(generatePageOptions(0)).toEqual([]);
  });
});

describe('getPageNumbers', () => {
  it('returns all pages when totalPages is within the visible window', () => {
    expect(getPageNumbers(1, 3)).toEqual([1, 2, 3]);
  });

  it('returns an empty list when totalPages is 0', () => {
    expect(getPageNumbers(1, 0)).toEqual([]);
  });

  it('anchors the window to the start when currentPage is near the beginning', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5]);
  });

  it('centers the window around currentPage when in the middle', () => {
    expect(getPageNumbers(5, 10)).toEqual([3, 4, 5, 6, 7]);
  });

  it('anchors the window to the end when currentPage is near the end', () => {
    expect(getPageNumbers(10, 10)).toEqual([6, 7, 8, 9, 10]);
  });

  it('always returns at most 5 page numbers', () => {
    for (let currentPage = 1; currentPage <= 20; currentPage++) {
      expect(getPageNumbers(currentPage, 20).length).toBeLessThanOrEqual(5);
    }
  });
});

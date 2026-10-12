import { renderHook } from '@testing-library/react';

import { useHasLoadedOnce } from './useHasLoadedOnce';

describe('useHasLoadedOnce', () => {
  it.each([
    { name: 'never started loading', sequence: [false], expected: false },
    {
      name: 'idle across re-renders',
      sequence: [false, false],
      expected: false,
    },
    { name: 'first load still in flight', sequence: [true], expected: false },
    { name: 'first load finished', sequence: [true, false], expected: true },
    {
      name: 'first load finished after an idle mount render',
      sequence: [false, true, false],
      expected: true,
    },
    {
      name: 'stays true during a later refetch',
      sequence: [true, false, true],
      expected: true,
    },
  ])('$name', ({ sequence, expected }) => {
    const [initialLoading, ...rest] = sequence;
    const { result, rerender } = renderHook(
      ({ loading }) => useHasLoadedOnce(loading),
      { initialProps: { loading: initialLoading } },
    );

    rest.forEach(loading => rerender({ loading }));

    expect(result.current).toBe(expected);
  });
});

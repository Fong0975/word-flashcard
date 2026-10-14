import { render } from '@testing-library/react';

import { GlassDot } from './GlassDot';

describe('GlassDot', () => {
  it.each([
    {
      name: 'draws the dot with the default radius',
      props: { cx: 10, cy: 20, fill: '#22c55e' },
      expected: { fill: '#22c55e', r: '4' },
    },
    {
      name: 'uses the given radius',
      props: { cx: 10, cy: 20, fill: '#ef4444', radius: 6 },
      expected: { fill: '#ef4444', r: '6' },
    },
    {
      name: 'renders nothing without a horizontal position',
      props: { cy: 20, fill: '#22c55e' },
      expected: null,
    },
    {
      name: 'renders nothing without a vertical position',
      props: { cx: 10, fill: '#22c55e' },
      expected: null,
    },
  ])('$name', ({ props, expected }) => {
    const { container } = render(
      <svg>
        <GlassDot {...props} />
      </svg>,
    );

    const circle = container.querySelector('circle');
    if (expected === null) {
      expect(circle).toBeNull();
      return;
    }
    expect(circle).toHaveAttribute('cx', '10');
    expect(circle).toHaveAttribute('cy', '20');
    expect(circle).toHaveAttribute('fill', expected.fill);
    expect(circle).toHaveAttribute('r', expected.r);
  });
});

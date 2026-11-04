import { render, screen } from '@testing-library/react';
import type { LegendPayload } from 'recharts';

import { TREND_LINE_DOT_FILL, TREND_LINE_DOT_RADIUS } from './renderHaloLine';
import { TrendLegendContent } from './TrendLegendContent';

const BAR: LegendPayload = {
  value: 'Practices',
  type: 'rect',
  color: 'rgba(99, 102, 241, 0.25)',
};
const LINE: LegendPayload = {
  value: 'Accuracy (%)',
  type: 'line',
  color: '#ee5a8c',
};
const HALO: LegendPayload = {
  value: 'accuracy_rate',
  type: 'none',
  color: '#ffffff',
};

describe('TrendLegendContent', () => {
  it.each([
    { name: 'without a payload', payload: undefined },
    { name: 'with an empty payload', payload: [] },
    { name: 'with only hidden series', payload: [HALO] },
  ])('renders nothing $name', ({ payload }) => {
    const { container } = render(<TrendLegendContent payload={payload} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one labelled entry per visible payload item, in order', () => {
    render(<TrendLegendContent payload={[BAR, HALO, LINE]} />);

    const items = screen.getAllByRole('listitem');
    expect(items.map(item => item.textContent)).toEqual([
      'Practices',
      'Accuracy (%)',
    ]);
  });

  it.each([
    {
      name: 'a line series gets a line with a white-filled dot',
      entry: LINE,
      expectLine: true,
    },
    {
      name: 'a bar series gets a plain swatch without a dot',
      entry: BAR,
      expectLine: false,
    },
  ])('$name', ({ entry, expectLine }) => {
    const { container } = render(<TrendLegendContent payload={[entry]} />);

    const circle = container.querySelector('circle');
    if (expectLine) {
      expect(container.querySelector('line')).toHaveAttribute(
        'stroke',
        entry.color,
      );
      expect(circle).toHaveAttribute('fill', TREND_LINE_DOT_FILL);
      expect(circle).toHaveAttribute('stroke', entry.color);
      expect(circle).toHaveAttribute('r', String(TREND_LINE_DOT_RADIUS));
    } else {
      expect(circle).toBeNull();
      expect(container.querySelector('rect')).toHaveAttribute(
        'fill',
        entry.color,
      );
    }
  });
});

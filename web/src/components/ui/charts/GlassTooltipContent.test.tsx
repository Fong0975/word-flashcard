import { render, screen } from '@testing-library/react';
import type { TooltipPayloadEntry } from 'recharts';

import { GlassTooltipContent } from './GlassTooltipContent';

const PAYLOAD: TooltipPayloadEntry[] = [
  { name: 'Practices', value: 15, color: '#4338ca', dataKey: 'practice_count' },
  {
    name: 'Accuracy (%)',
    value: 80,
    color: '#38bdf8',
    dataKey: 'accuracy_rate',
  },
];

describe('GlassTooltipContent', () => {
  it.each([
    { name: 'inactive', active: false, payload: PAYLOAD },
    { name: 'without a payload', active: true, payload: undefined },
    { name: 'with an empty payload', active: true, payload: [] },
  ])('renders nothing when $name', ({ active, payload }) => {
    const { container } = render(
      <GlassTooltipContent active={active} payload={payload} label='x' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    {
      name: 'formats the label when a formatter is given',
      labelFormatter: (label: string) => `formatted ${label}`,
      expectedHeading: 'formatted 2026-09-24',
    },
    {
      name: 'shows the raw label without a formatter',
      labelFormatter: undefined,
      expectedHeading: '2026-09-24',
    },
  ])('$name', ({ labelFormatter, expectedHeading }) => {
    render(
      <GlassTooltipContent
        active
        payload={PAYLOAD}
        label='2026-09-24'
        labelFormatter={labelFormatter}
      />,
    );

    expect(screen.getByText(expectedHeading)).toBeInTheDocument();
    expect(screen.getByText('Practices')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Accuracy (%)')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('keeps item text uncolored and shows the series color as a swatch', () => {
    render(<GlassTooltipContent active payload={PAYLOAD} label='x' />);

    const name = screen.getByText('Practices');
    expect(name).not.toHaveAttribute('style');
    const swatch = name.previousElementSibling as HTMLElement;
    expect(swatch).toHaveStyle({ backgroundColor: '#4338ca' });
  });
});

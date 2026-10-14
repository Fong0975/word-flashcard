import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SegmentedToggle } from './SegmentedToggle';

const OPTIONS = [
  { value: 'first', label: 'First' },
  { value: 'second', label: 'Second' },
  { value: 'third', label: 'Third' },
] as const;

describe('SegmentedToggle', () => {
  it('renders the segments in order', () => {
    render(
      <SegmentedToggle options={OPTIONS} value='first' onChange={vi.fn()} />,
    );

    expect(
      screen.getAllByRole('button').map(button => button.textContent),
    ).toEqual(['First', 'Second', 'Third']);
  });

  it.each([
    { value: 'first' as const, pressed: [true, false, false] },
    { value: 'second' as const, pressed: [false, true, false] },
    { value: 'third' as const, pressed: [false, false, true] },
  ])('marks only the $value segment as selected', ({ value, pressed }) => {
    render(
      <SegmentedToggle options={OPTIONS} value={value} onChange={vi.fn()} />,
    );

    screen.getAllByRole('button').forEach((button, index) => {
      expect(button).toHaveAttribute('aria-pressed', String(pressed[index]));
      if (pressed[index]) {
        expect(button).toHaveClass('glass-button-primary');
      } else {
        expect(button).toHaveClass('glass-interactive');
      }
    });
  });

  it.each([
    {
      name: 'a single segment is rounded on both sides',
      count: 1,
      expected: [['rounded-l-md', 'rounded-r-md']],
      unexpected: [['segmented-divider']],
    },
    {
      name: 'only the outer segments are rounded and inner ones get a divider',
      count: 3,
      expected: [
        ['rounded-l-md'],
        ['segmented-divider'],
        ['segmented-divider', 'rounded-r-md'],
      ],
      unexpected: [
        ['segmented-divider', 'rounded-r-md'],
        ['rounded-l-md', 'rounded-r-md'],
        ['rounded-l-md'],
      ],
    },
  ])('$name', ({ count, expected, unexpected }) => {
    render(
      <SegmentedToggle
        options={OPTIONS.slice(0, count)}
        value='first'
        onChange={vi.fn()}
      />,
    );

    screen.getAllByRole('button').forEach((button, index) => {
      expected[index].forEach(cls => expect(button).toHaveClass(cls));
      unexpected[index].forEach(cls => expect(button).not.toHaveClass(cls));
    });
  });

  it('calls onChange with the value of the clicked segment', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedToggle options={OPTIONS} value='first' onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Third' }));

    expect(onChange).toHaveBeenCalledWith('third');
  });

  it('applies the given class to the wrapper', () => {
    const { container } = render(
      <SegmentedToggle
        options={OPTIONS}
        value='first'
        onChange={vi.fn()}
        className='mb-5'
      />,
    );

    expect(container.firstChild).toHaveClass('flex', 'justify-center', 'mb-5');
  });
});

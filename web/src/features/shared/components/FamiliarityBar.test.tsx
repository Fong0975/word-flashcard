import { render, screen } from '@testing-library/react';

import { FamiliarityLevel } from '../../../types/base';

import { FamiliarityBar } from './FamiliarityBar';

describe('FamiliarityBar', () => {
  it('renders nothing when there is no familiarity', () => {
    const { container } = render(<FamiliarityBar familiarity='' />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    {
      name: 'green',
      familiarity: FamiliarityLevel.GREEN,
      orientation: undefined,
      className: undefined,
      expected: 'glass-glow-bar mx-auto glass-glow-green',
    },
    {
      name: 'yellow',
      familiarity: FamiliarityLevel.YELLOW,
      orientation: undefined,
      className: undefined,
      expected: 'glass-glow-bar mx-auto glass-glow-yellow',
    },
    {
      name: 'red',
      familiarity: FamiliarityLevel.RED,
      orientation: undefined,
      className: undefined,
      expected: 'glass-glow-bar mx-auto glass-glow-red',
    },
    {
      name: 'an unknown level without a tone class',
      familiarity: 'invalid',
      orientation: undefined,
      className: undefined,
      expected: 'glass-glow-bar mx-auto',
    },
    {
      name: 'green with extra classes',
      familiarity: FamiliarityLevel.GREEN,
      orientation: undefined,
      className: 'mb-4 w-24',
      expected: 'glass-glow-bar mx-auto glass-glow-green mb-4 w-24',
    },
    {
      name: 'a vertical red band that is not centered',
      familiarity: FamiliarityLevel.RED,
      orientation: 'vertical' as const,
      className: 'mr-4 h-12 w-1.5',
      expected: 'glass-glow-bar flex-shrink-0 glass-glow-red mr-4 h-12 w-1.5',
    },
  ])(
    'renders a glass bar for $name',
    ({ familiarity, orientation, className, expected }) => {
      render(
        <FamiliarityBar
          familiarity={familiarity}
          orientation={orientation}
          className={className}
        />,
      );

      expect(screen.getByTestId('familiarity-bar')).toHaveAttribute(
        'class',
        expected,
      );
    },
  );
});

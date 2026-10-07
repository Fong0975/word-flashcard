import { render, screen } from '@testing-library/react';

import { AccuracyBar } from './AccuracyBar';

describe('AccuracyBar', () => {
  it.each([
    {
      name: 'never practiced without a tone class',
      accuracyRate: null,
      className: undefined,
      expected: 'glass-glow-bar',
    },
    {
      name: 'high accuracy',
      accuracyRate: 100,
      className: undefined,
      expected: 'glass-glow-bar glass-glow-green',
    },
    {
      name: 'medium accuracy',
      accuracyRate: 75,
      className: undefined,
      expected: 'glass-glow-bar glass-glow-yellow',
    },
    {
      name: 'low accuracy',
      accuracyRate: 25,
      className: undefined,
      expected: 'glass-glow-bar glass-glow-red',
    },
    {
      name: 'zero accuracy',
      accuracyRate: 0,
      className: undefined,
      expected: 'glass-glow-bar glass-glow-red',
    },
    {
      name: 'high accuracy with extra classes',
      accuracyRate: 100,
      className: 'absolute h-1.5',
      expected: 'glass-glow-bar glass-glow-green absolute h-1.5',
    },
  ])(
    'renders a glass bar for $name',
    ({ accuracyRate, className, expected }) => {
      render(<AccuracyBar accuracyRate={accuracyRate} className={className} />);

      expect(screen.getByTestId('accuracy-bar')).toHaveAttribute(
        'class',
        expected,
      );
    },
  );
});

import { render, screen } from '@testing-library/react';

import { AccuracyBadge } from './AccuracyBadge';

describe('AccuracyBadge', () => {
  it('renders the accuracy percentage', () => {
    render(<AccuracyBadge accuracyRate={80} />);
    expect(screen.getByText('Accuracy Rate: 80%')).toBeInTheDocument();
  });
});

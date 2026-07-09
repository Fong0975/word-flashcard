import { render, screen } from '@testing-library/react';

import { PracticeStats } from './PracticeStats';

describe('PracticeStats', () => {
  it('renders the practice and failure counts', () => {
    render(
      <PracticeStats practiceCount={10} failureCount={2} accuracyRate={80} />,
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows the accuracy badge once there is at least one practice', () => {
    render(
      <PracticeStats practiceCount={10} failureCount={2} accuracyRate={80} />,
    );
    expect(screen.getByText('Accuracy Rate: 80%')).toBeInTheDocument();
  });

  it('hides the accuracy badge when there have been no practices', () => {
    render(
      <PracticeStats practiceCount={0} failureCount={0} accuracyRate={0} />,
    );
    expect(screen.queryByText(/Accuracy Rate/)).not.toBeInTheDocument();
  });
});

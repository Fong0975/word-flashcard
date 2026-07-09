import { render, screen } from '@testing-library/react';

import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders the default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders a custom message', () => {
    render(<LoadingSpinner message='Fetching words...' />);
    expect(screen.getByText('Fetching words...')).toBeInTheDocument();
  });
});

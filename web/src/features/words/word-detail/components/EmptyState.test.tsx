import { render, screen } from '@testing-library/react';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the no-definitions message', () => {
    render(<EmptyState />);
    expect(
      screen.getByText('No definitions available for this word yet.'),
    ).toBeInTheDocument();
  });
});

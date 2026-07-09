import { render, screen } from '@testing-library/react';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders default title, description, and icon', () => {
    render(<EmptyState onRefresh={jest.fn()} />);

    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(
      screen.getByText(/no items in your collection/i),
    ).toBeInTheDocument();
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('renders custom title, description, and icon when provided', () => {
    render(
      <EmptyState
        onRefresh={jest.fn()}
        icon='🔍'
        title='No results'
        description='Try a different search term.'
      />,
    );

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(
      screen.getByText('Try a different search term.'),
    ).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });
});

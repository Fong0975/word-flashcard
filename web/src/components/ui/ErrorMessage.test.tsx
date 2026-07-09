import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders the default title and the error text', () => {
    render(
      <ErrorMessage
        error='Network error'
        onRetry={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    render(
      <ErrorMessage
        error='Network error'
        title='Failed to load words'
        onRetry={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(screen.getByText('Failed to load words')).toBeInTheDocument();
  });

  it('calls onRetry when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <ErrorMessage
        error='Network error'
        onRetry={onRetry}
        onDismiss={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when "Dismiss" is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(
      <ErrorMessage
        error='Network error'
        onRetry={jest.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

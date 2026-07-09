import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PaginationNavButton } from './PaginationNavButton';

describe('PaginationNavButton', () => {
  it.each([
    ['first', 'First page'],
    ['previous', 'Previous'],
    ['next', 'Next'],
    ['last', 'Last page'],
  ] as const)('renders the accessible label for the %s type', (type, label) => {
    render(
      <PaginationNavButton
        type={type}
        layout='desktop'
        isEnabled
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('calls onClick when enabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <PaginationNavButton
        type='next'
        layout='desktop'
        isEnabled
        onClick={onClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isEnabled is false', () => {
    render(
      <PaginationNavButton
        type='next'
        layout='desktop'
        isEnabled={false}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('renders in the mobile layout without crashing', () => {
    render(
      <PaginationNavButton
        type='previous'
        layout='mobile'
        isEnabled
        onClick={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Previous' }),
    ).toBeInTheDocument();
  });
});

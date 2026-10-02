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
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('calls onClick when enabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
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
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it.each([
    ['desktop', ['bg-white/10', 'backdrop-blur-lg'], ['bg-gray-100']],
    ['mobile', ['glass-panel'], ['bg-gray-100']],
  ] as const)(
    'applies the %s disabled surface',
    (layout, expectedClasses, absentClasses) => {
      render(
        <PaginationNavButton
          type='next'
          layout={layout}
          isEnabled={false}
          onClick={vi.fn()}
        />,
      );

      const button = screen.getByRole('button', { name: 'Next' });
      expect(button).toHaveClass('cursor-not-allowed', ...expectedClasses);
      absentClasses.forEach(cls => expect(button).not.toHaveClass(cls));
    },
  );

  it('renders in the mobile layout without crashing', () => {
    render(
      <PaginationNavButton
        type='previous'
        layout='mobile'
        isEnabled
        onClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Previous' }),
    ).toBeInTheDocument();
  });
});

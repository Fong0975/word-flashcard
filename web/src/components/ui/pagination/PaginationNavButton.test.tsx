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

  it.each([
    ['desktop', ['bg-white/10'], ['bg-gray-100', 'backdrop-blur-lg']],
    ['mobile', ['glass-panel'], ['bg-gray-100']],
  ] as const)(
    'is disabled with the %s disabled surface when isEnabled is false',
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
      expect(button).toBeDisabled();
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

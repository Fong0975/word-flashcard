import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuickFilterButton } from './QuickFilterButton';

describe('QuickFilterButton', () => {
  it('renders the label', () => {
    render(
      <QuickFilterButton label='Red' isActive={false} onClick={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: /Red/ })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <QuickFilterButton label='Red' isActive={false} onClick={onClick} />,
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the label regardless of active state', () => {
    render(<QuickFilterButton label='Red' isActive onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Red/ })).toBeInTheDocument();
  });
});

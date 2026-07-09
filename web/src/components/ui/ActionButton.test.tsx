import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DropdownMenuItem } from './DropdownMenu';
import { ActionButton } from './ActionButton';

const buildItems = (onClick: () => void = jest.fn()): DropdownMenuItem[] => [
  { id: 'edit', label: 'Edit', onClick },
];

describe('ActionButton', () => {
  it('renders the trigger label', () => {
    render(<ActionButton label='Actions' items={buildItems()} />);
    expect(
      screen.getByRole('button', { name: /actions/i }),
    ).toBeInTheDocument();
  });

  it('opens the dropdown and invokes the item handler on click', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<ActionButton label='Actions' items={buildItems(onClick)} />);

    await user.click(screen.getByRole('button', { name: /actions/i }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not open the dropdown when disabled', async () => {
    const user = userEvent.setup();
    render(<ActionButton label='Actions' items={buildItems()} disabled />);

    await user.click(screen.getByRole('button', { name: /actions/i }));

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});

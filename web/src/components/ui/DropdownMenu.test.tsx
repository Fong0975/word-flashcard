import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';

const buildItems = (
  overrides: Partial<DropdownMenuItem> = {},
): DropdownMenuItem[] => [
  { id: 'edit', label: 'Edit', onClick: vi.fn(), ...overrides },
];

describe('DropdownMenu', () => {
  it('does not show menu items until the trigger is clicked', () => {
    render(
      <DropdownMenu trigger={<button>Menu</button>} items={buildItems()} />,
    );
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('opens the menu when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<button>Menu</button>} items={buildItems()} />,
    );

    await user.click(screen.getByText('Menu'));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('applies the default menu width when menuWidthClassName is not set', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<button>Menu</button>} items={buildItems()} />,
    );

    await user.click(screen.getByText('Menu'));
    expect(screen.getByRole('menu').parentElement).toHaveClass('w-56');
  });

  it('applies a custom menuWidthClassName to the menu panel', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={buildItems()}
        menuWidthClassName='w-24'
      />,
    );

    await user.click(screen.getByText('Menu'));
    expect(screen.getByRole('menu').parentElement).toHaveClass('w-24');
  });

  it('invokes the item handler and closes the menu on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={buildItems({ onClick })}
      />,
    );

    await user.click(screen.getByText('Menu'));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('does not invoke the handler for a disabled item and keeps the menu open', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={buildItems({ onClick, disabled: true })}
      />,
    );

    await user.click(screen.getByText('Menu'));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('closes the menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DropdownMenu trigger={<button>Menu</button>} items={buildItems()} />
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByText('Menu'));
    expect(screen.getByRole('menuitem')).toBeInTheDocument();

    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('closes the menu when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<button>Menu</button>} items={buildItems()} />,
    );

    await user.click(screen.getByText('Menu'));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});

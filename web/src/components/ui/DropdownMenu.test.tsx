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

  it('opens the menu above the trigger when there is not enough room below', async () => {
    const user = userEvent.setup();
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        bottom: 780,
        top: 760,
        left: 0,
        right: 0,
        width: 0,
        height: 20,
        x: 0,
        y: 760,
        toJSON: () => {},
      } as DOMRect);
    const innerHeightSpy = vi
      .spyOn(window, 'innerHeight', 'get')
      .mockReturnValue(800);

    render(
      <DropdownMenu trigger={<button>Menu</button>} items={buildItems()} />,
    );

    await user.click(screen.getByText('Menu'));

    expect(screen.getByRole('menu').parentElement).toHaveClass('bottom-full');
    expect(screen.getByRole('menu').parentElement).not.toHaveClass('top-full');

    rectSpy.mockRestore();
    innerHeightSpy.mockRestore();
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

  it('shows a checkmark for the selected item', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={buildItems({ isSelected: true })}
      />,
    );

    await user.click(screen.getByText('Menu'));

    expect(
      screen.getByRole('menuitem', { name: 'Edit' }).querySelector('svg'),
    ).toBeInTheDocument();
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

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SymbolButton } from '../../../types/components';

import { SymbolsMenu } from './SymbolsMenu';

const ITEMS: SymbolButton[] = [
  { label: '→', value: '→' },
  {
    label: 'Alert',
    children: [
      { label: 'NOTE', value: '> [!NOTE]\n> ' },
      { label: 'TIP', value: '> [!TIP]\n> ' },
    ],
  },
];

const setup = (items: SymbolButton[] = ITEMS) => {
  const onInsert = vi.fn();
  render(
    <SymbolsMenu
      items={items}
      onInsert={onInsert}
      trigger={<button type='button'>Symbols</button>}
    />,
  );
  return { onInsert, user: userEvent.setup() };
};

const mockNarrowViewport = (isNarrow: boolean) => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: isNarrow,
  })) as unknown as typeof window.matchMedia;
};

describe('SymbolsMenu', () => {
  afterEach(() => {
    // @ts-expect-error restore jsdom's lack of matchMedia
    delete window.matchMedia;
  });

  it('inserts a plain entry and closes the menu', async () => {
    const { onInsert, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Symbols' }));
    await user.click(screen.getByRole('menuitem', { name: '→' }));

    expect(onInsert).toHaveBeenCalledWith('→');
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('marks a group entry as a submenu trigger without showing children yet', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Symbols' }));

    const group = screen.getByRole('menuitem', { name: 'Alert' });
    expect(group).toHaveAttribute('aria-haspopup', 'menu');
    expect(group).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('menuitem', { name: 'NOTE' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      name: 'a wide viewport with a mouse (hover already opened it)',
      isNarrow: false,
      secondClickKeepsOpen: true,
    },
    {
      name: 'a phone-width viewport (no hover)',
      isNarrow: true,
      secondClickKeepsOpen: false,
    },
  ])(
    'clicking a group on $name never inserts or closes the menu',
    async ({ isNarrow, secondClickKeepsOpen }) => {
      mockNarrowViewport(isNarrow);
      const { onInsert, user } = setup();

      await user.click(screen.getByRole('button', { name: 'Symbols' }));
      await user.click(screen.getByRole('menuitem', { name: 'Alert' }));

      expect(screen.getByRole('menuitem', { name: 'NOTE' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Alert' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(onInsert).not.toHaveBeenCalled();

      await user.click(screen.getByRole('menuitem', { name: 'Alert' }));
      if (secondClickKeepsOpen) {
        expect(screen.getByRole('menuitem', { name: 'NOTE' })).toBeVisible();
      } else {
        expect(
          screen.queryByRole('menuitem', { name: 'NOTE' }),
        ).not.toBeInTheDocument();
      }
      expect(screen.getByRole('menuitem', { name: 'Alert' })).toBeVisible();
      expect(onInsert).not.toHaveBeenCalled();
    },
  );

  it.each([
    { name: 'a wide viewport', isNarrow: false, expectedWidth: 'w-24' },
    { name: 'a phone-width viewport', isNarrow: true, expectedWidth: 'w-40' },
  ])(
    'sizes the panel to $expectedWidth once a group is expanded on $name, without horizontal scroll',
    async ({ isNarrow, expectedWidth }) => {
      mockNarrowViewport(isNarrow);
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: 'Symbols' }));
      expect(screen.getAllByRole('menu')[0].parentElement).toHaveClass('w-24');

      await user.click(screen.getByRole('menuitem', { name: 'Alert' }));

      const scrollArea = screen.getAllByRole('menu')[0];
      expect(scrollArea.parentElement).toHaveClass(expectedWidth);
      expect(scrollArea).toHaveClass('overflow-x-hidden');
    },
  );

  it.each([
    { name: 'a wide viewport', isNarrow: false },
    { name: 'a phone-width viewport', isNarrow: true },
  ])(
    'inserts a child value and closes the whole menu on $name',
    async ({ isNarrow }) => {
      mockNarrowViewport(isNarrow);
      const { onInsert, user } = setup();

      await user.click(screen.getByRole('button', { name: 'Symbols' }));
      await user.click(screen.getByRole('menuitem', { name: 'Alert' }));
      await user.click(screen.getByRole('menuitem', { name: 'TIP' }));

      expect(onInsert).toHaveBeenCalledWith('> [!TIP]\n> ');
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    },
  );

  it('opens the submenu when the mouse hovers a group and swaps it when hovering a plain entry', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Symbols' }));

    fireEvent.pointerEnter(screen.getByRole('menuitem', { name: 'Alert' }), {
      pointerType: 'mouse',
    });
    expect(screen.getByRole('menuitem', { name: 'NOTE' })).toBeVisible();

    fireEvent.pointerEnter(screen.getByRole('menuitem', { name: '→' }), {
      pointerType: 'mouse',
    });
    expect(
      screen.queryByRole('menuitem', { name: 'NOTE' }),
    ).not.toBeInTheDocument();
  });

  it('does not open the submenu on touch hover emulation', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Symbols' }));

    fireEvent.pointerEnter(screen.getByRole('menuitem', { name: 'Alert' }), {
      pointerType: 'touch',
    });

    expect(
      screen.queryByRole('menuitem', { name: 'NOTE' }),
    ).not.toBeInTheDocument();
  });

  it('opens a submenu with ArrowRight and collapses it with ArrowLeft', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Symbols' }));

    const group = screen.getByRole('menuitem', { name: 'Alert' });
    group.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'NOTE' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(
      screen.queryByRole('menuitem', { name: 'NOTE' }),
    ).not.toBeInTheDocument();
    expect(group).toHaveFocus();
  });

  it('closes the whole menu on Escape', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Symbols' }));
    await user.click(screen.getByRole('menuitem', { name: 'Alert' }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('does not open while disabled', async () => {
    const onInsert = vi.fn();
    const user = userEvent.setup();
    render(
      <SymbolsMenu
        items={ITEMS}
        onInsert={onInsert}
        disabled
        trigger={<button type='button'>Symbols</button>}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Symbols' }));

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});

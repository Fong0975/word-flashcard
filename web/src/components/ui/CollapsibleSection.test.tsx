import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it.each([
    { state: 'closed', isOpen: false, ariaExpanded: 'false' },
    { state: 'open', isOpen: true, ariaExpanded: 'true' },
  ])(
    'shows the title, and the children only when open ($state)',
    ({ isOpen, ariaExpanded }) => {
      render(
        <CollapsibleSection title='History' isOpen={isOpen} onToggle={vi.fn()}>
          <p>Section content</p>
        </CollapsibleSection>,
      );

      expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute(
        'aria-expanded',
        ariaExpanded,
      );
      expect(screen.queryAllByText('Section content')).toHaveLength(
        isOpen ? 1 : 0,
      );
    },
  );

  it.each([
    { state: 'with an iconPath', iconPath: 'M12 6v6h4.5', iconCount: 1 },
    { state: 'without an iconPath', iconPath: undefined, iconCount: 0 },
  ])(
    'renders the title icon only when given one ($state)',
    ({ iconPath, iconCount }) => {
      render(
        <CollapsibleSection
          title='History'
          isOpen={false}
          onToggle={vi.fn()}
          iconPath={iconPath}
        >
          <p>Section content</p>
        </CollapsibleSection>,
      );

      const icons = screen.queryAllByTestId('collapsible-section-icon');
      expect(icons).toHaveLength(iconCount);
      icons.forEach(icon => expect(icon).toContainHTML(iconPath ?? ''));
      // The icon is decorative, so the button keeps the title as its name.
      expect(
        screen.getByRole('button', { name: 'History' }),
      ).toBeInTheDocument();
    },
  );

  it('calls onToggle when the header button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <CollapsibleSection title='History' isOpen={false} onToggle={onToggle}>
        <p>Section content</p>
      </CollapsibleSection>,
    );

    await user.click(screen.getByRole('button', { name: 'History' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

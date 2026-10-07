import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FamiliarityLevel } from '../../../../types/base';
import { FAMILIARITY_LABELS } from '../../../shared/constants/familiarity';

import { FamiliaritySelector } from './FamiliaritySelector';

describe('FamiliaritySelector', () => {
  it('renders nothing in create mode', () => {
    const { container } = render(
      <FamiliaritySelector
        value={FamiliarityLevel.GREEN}
        onChange={vi.fn()}
        disabled={false}
        mode='create'
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the current value in edit mode', () => {
    render(
      <FamiliaritySelector
        value={FamiliarityLevel.YELLOW}
        onChange={vi.fn()}
        disabled={false}
        mode='edit'
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Select familiarity level' }),
    ).toHaveTextContent(FAMILIARITY_LABELS[FamiliarityLevel.YELLOW]);
  });

  it.each([
    { level: FamiliarityLevel.GREEN, dotClass: 'bg-green-500' },
    { level: FamiliarityLevel.YELLOW, dotClass: 'bg-yellow-500' },
    { level: FamiliarityLevel.RED, dotClass: 'bg-red-500' },
  ])(
    'shows a decorative $dotClass dot before the $level label on the trigger and its menu item',
    async ({ level, dotClass }) => {
      const user = userEvent.setup();
      render(
        <FamiliaritySelector
          value={level}
          onChange={vi.fn()}
          disabled={false}
          mode='edit'
        />,
      );

      const trigger = screen.getByRole('button', {
        name: 'Select familiarity level',
      });
      const triggerDot = within(trigger).getByTestId('familiarity-dot');
      expect(triggerDot).toHaveClass(dotClass);
      expect(triggerDot).toHaveAttribute('aria-hidden', 'true');

      await user.click(trigger);

      const menuItem = screen.getByRole('menuitem', {
        name: FAMILIARITY_LABELS[level],
      });
      const menuItemDot = within(menuItem).getByTestId('familiarity-dot');
      expect(menuItemDot).toHaveClass(dotClass);
      expect(menuItemDot).toHaveAttribute('aria-hidden', 'true');
    },
  );

  it('calls onChange with the selected level', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FamiliaritySelector
        value={FamiliarityLevel.GREEN}
        onChange={onChange}
        disabled={false}
        mode='edit'
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Select familiarity level' }),
    );
    await user.click(
      screen.getByRole('menuitem', {
        name: FAMILIARITY_LABELS[FamiliarityLevel.RED],
      }),
    );
    expect(onChange).toHaveBeenCalledWith(FamiliarityLevel.RED);
  });

  it('is disabled when disabled is set', () => {
    render(
      <FamiliaritySelector
        value={FamiliarityLevel.GREEN}
        onChange={vi.fn()}
        disabled
        mode='edit'
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Select familiarity level' }),
    ).toBeDisabled();
  });
});

import { render, screen } from '@testing-library/react';
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

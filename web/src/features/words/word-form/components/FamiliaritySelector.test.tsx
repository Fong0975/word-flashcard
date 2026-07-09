import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FamiliarityLevel } from '../../../../types/base';

import { FamiliaritySelector } from './FamiliaritySelector';

describe('FamiliaritySelector', () => {
  it('renders nothing in create mode', () => {
    const { container } = render(
      <FamiliaritySelector
        value={FamiliarityLevel.GREEN}
        onChange={jest.fn()}
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
        onChange={jest.fn()}
        disabled={false}
        mode='edit'
      />,
    );
    expect(screen.getByRole('combobox')).toHaveValue(FamiliarityLevel.YELLOW);
  });

  it('calls onChange with the selected level', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <FamiliaritySelector
        value={FamiliarityLevel.GREEN}
        onChange={onChange}
        disabled={false}
        mode='edit'
      />,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'Red');
    expect(onChange).toHaveBeenCalledWith(FamiliarityLevel.RED);
  });

  it('is disabled when disabled is set', () => {
    render(
      <FamiliaritySelector
        value={FamiliarityLevel.GREEN}
        onChange={jest.fn()}
        disabled
        mode='edit'
      />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});

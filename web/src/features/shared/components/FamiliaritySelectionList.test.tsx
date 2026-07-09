import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FamiliarityLevel } from '../../../types/base';

import { FamiliaritySelectionList } from './FamiliaritySelectionList';

describe('FamiliaritySelectionList', () => {
  it('renders an option for every familiarity level', () => {
    render(
      <FamiliaritySelectionList
        selectedFamiliarity={[]}
        onToggle={jest.fn()}
      />,
    );

    expect(screen.getByText('Green Level')).toBeInTheDocument();
    expect(screen.getByText('Yellow Level')).toBeInTheDocument();
    expect(screen.getByText('Red Level')).toBeInTheDocument();
  });

  it('checks the boxes for the selected levels', () => {
    render(
      <FamiliaritySelectionList
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        onToggle={jest.fn()}
      />,
    );

    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  });

  it('calls onToggle with the clicked level', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(
      <FamiliaritySelectionList selectedFamiliarity={[]} onToggle={onToggle} />,
    );

    await user.click(screen.getByText('Red Level'));
    expect(onToggle).toHaveBeenCalledWith(FamiliarityLevel.RED);
  });

  it('shows a warning when nothing is selected', () => {
    render(
      <FamiliaritySelectionList
        selectedFamiliarity={[]}
        onToggle={jest.fn()}
      />,
    );
    expect(
      screen.getByText('Please select at least one familiarity level.'),
    ).toBeInTheDocument();
  });

  it('does not show the warning once something is selected', () => {
    render(
      <FamiliaritySelectionList
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        onToggle={jest.fn()}
      />,
    );
    expect(
      screen.queryByText('Please select at least one familiarity level.'),
    ).not.toBeInTheDocument();
  });
});

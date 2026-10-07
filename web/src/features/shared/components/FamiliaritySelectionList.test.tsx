import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FamiliarityLevel } from '../../../types/base';
import { FAMILIARITY_LABELS } from '../constants';

import { FamiliaritySelectionList } from './FamiliaritySelectionList';

describe('FamiliaritySelectionList', () => {
  it.each(Object.values(FamiliarityLevel))(
    'renders the %s option with its familiarity label',
    level => {
      render(
        <FamiliaritySelectionList
          selectedFamiliarity={[]}
          onToggle={vi.fn()}
        />,
      );

      expect(screen.getByText(FAMILIARITY_LABELS[level])).toBeInTheDocument();
    },
  );

  it('checks the boxes for the selected levels', () => {
    render(
      <FamiliaritySelectionList
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  });

  it('calls onToggle with the clicked level', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <FamiliaritySelectionList selectedFamiliarity={[]} onToggle={onToggle} />,
    );

    await user.click(
      screen.getByText(FAMILIARITY_LABELS[FamiliarityLevel.RED]),
    );
    expect(onToggle).toHaveBeenCalledWith(FamiliarityLevel.RED);
  });

  it('shows a warning when nothing is selected', () => {
    render(
      <FamiliaritySelectionList selectedFamiliarity={[]} onToggle={vi.fn()} />,
    );
    expect(
      screen.getByText('Please select at least one familiarity level.'),
    ).toBeInTheDocument();
  });

  it('does not show the warning once something is selected', () => {
    render(
      <FamiliaritySelectionList
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        onToggle={vi.fn()}
      />,
    );
    expect(
      screen.queryByText('Please select at least one familiarity level.'),
    ).not.toBeInTheDocument();
  });
});

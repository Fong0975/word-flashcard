import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FamiliarityLevel } from '../../../../types/base';

import { FamiliarityRatingButtons } from './FamiliarityRatingButtons';

describe('FamiliarityRatingButtons', () => {
  it('renders a button for every familiarity level', () => {
    render(<FamiliarityRatingButtons onSelect={jest.fn()} />);

    expect(screen.getByText('Unfamiliar')).toBeInTheDocument();
    expect(screen.getByText('Somewhat Familiar')).toBeInTheDocument();
    expect(screen.getByText('Familiar')).toBeInTheDocument();
  });

  it('calls onSelect with the corresponding familiarity level', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<FamiliarityRatingButtons onSelect={onSelect} />);

    await user.click(screen.getByText('Unfamiliar'));
    expect(onSelect).toHaveBeenCalledWith(FamiliarityLevel.RED);

    await user.click(screen.getByText('Somewhat Familiar'));
    expect(onSelect).toHaveBeenCalledWith(FamiliarityLevel.YELLOW);

    await user.click(screen.getByText('Familiar'));
    expect(onSelect).toHaveBeenCalledWith(FamiliarityLevel.GREEN);
  });
});

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

  it('disables all three buttons when disabled is true', () => {
    render(<FamiliarityRatingButtons onSelect={jest.fn()} disabled />);

    expect(screen.getByRole('button', { name: 'Unfamiliar' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Somewhat Familiar' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Familiar' })).toBeDisabled();
  });

  it('shows a spinner on the button matching loadingLevel and does not call onSelect when clicked while disabled', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <FamiliarityRatingButtons
        onSelect={onSelect}
        disabled
        loadingLevel={FamiliarityLevel.YELLOW}
      />,
    );

    expect(screen.queryByText('Somewhat Familiar')).not.toBeInTheDocument();
    expect(screen.getByText('Unfamiliar')).toBeInTheDocument();
    expect(screen.getByText('Familiar')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Unfamiliar' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders normally when disabled and loadingLevel are left undefined', () => {
    render(<FamiliarityRatingButtons onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Unfamiliar' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Somewhat Familiar' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Familiar' })).toBeEnabled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FamiliarityLevel } from '../../../../types/base';
import { FAMILIARITY_LABELS } from '../../../shared/constants/familiarity';

import { FamiliarityRatingButtons } from './FamiliarityRatingButtons';

const RED_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.RED];
const YELLOW_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.YELLOW];
const GREEN_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.GREEN];

describe('FamiliarityRatingButtons', () => {
  it('renders a button for every familiarity level', () => {
    render(<FamiliarityRatingButtons onSelect={vi.fn()} />);

    expect(screen.getByText(RED_LABEL)).toBeInTheDocument();
    expect(screen.getByText(YELLOW_LABEL)).toBeInTheDocument();
    expect(screen.getByText(GREEN_LABEL)).toBeInTheDocument();
  });

  it('calls onSelect with the corresponding familiarity level', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FamiliarityRatingButtons onSelect={onSelect} />);

    await user.click(screen.getByText(RED_LABEL));
    expect(onSelect).toHaveBeenCalledWith(FamiliarityLevel.RED);

    await user.click(screen.getByText(YELLOW_LABEL));
    expect(onSelect).toHaveBeenCalledWith(FamiliarityLevel.YELLOW);

    await user.click(screen.getByText(GREEN_LABEL));
    expect(onSelect).toHaveBeenCalledWith(FamiliarityLevel.GREEN);
  });

  it('disables all three buttons when disabled is true', () => {
    render(<FamiliarityRatingButtons onSelect={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: RED_LABEL })).toBeDisabled();
    expect(screen.getByRole('button', { name: YELLOW_LABEL })).toBeDisabled();
    expect(screen.getByRole('button', { name: GREEN_LABEL })).toBeDisabled();
  });

  it('shows a spinner on the button matching loadingLevel and does not call onSelect when clicked while disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <FamiliarityRatingButtons
        onSelect={onSelect}
        disabled
        loadingLevel={FamiliarityLevel.YELLOW}
      />,
    );

    expect(screen.queryByText(YELLOW_LABEL)).not.toBeInTheDocument();
    expect(screen.getByText(RED_LABEL)).toBeInTheDocument();
    expect(screen.getByText(GREEN_LABEL)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: RED_LABEL }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders normally when disabled and loadingLevel are left undefined', () => {
    render(<FamiliarityRatingButtons onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: RED_LABEL })).toBeEnabled();
    expect(screen.getByRole('button', { name: YELLOW_LABEL })).toBeEnabled();
    expect(screen.getByRole('button', { name: GREEN_LABEL })).toBeEnabled();
  });
});

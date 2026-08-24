import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordLinkSuggestionPopup } from './WordLinkSuggestionPopup';

describe('WordLinkSuggestionPopup', () => {
  it('shows the detected word', () => {
    render(
      <WordLinkSuggestionPopup
        word='apple'
        onInsert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText(/apple/)).toBeInTheDocument();
  });

  it('calls onInsert when "Add link" is clicked', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(
      <WordLinkSuggestionPopup
        word='apple'
        onInsert={onInsert}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add link' }));
    expect(onInsert).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when "Skip" is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <WordLinkSuggestionPopup
        word='apple'
        onInsert={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordLinkSuggestionBanner } from './WordLinkSuggestionBanner';

describe('WordLinkSuggestionBanner', () => {
  it('announces the detected word as a status banner', () => {
    render(
      <WordLinkSuggestionBanner
        word='apple'
        onInsert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/apple/);
  });

  it('calls onInsert when "Add link" is clicked', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(
      <WordLinkSuggestionBanner
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
      <WordLinkSuggestionBanner
        word='apple'
        onInsert={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: 'hides queue progress when there is only one candidate',
      progress: { current: 1, total: 1 },
      text: /of 1/,
      shown: false,
    },
    {
      name: 'shows queue progress when cascading through multiple missed candidates',
      progress: { current: 2, total: 3 },
      text: /2 of 3/,
      shown: true,
    },
  ])('$name', ({ progress, text, shown }) => {
    render(
      <WordLinkSuggestionBanner
        word='banana'
        progress={progress}
        onInsert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    if (shown) {
      expect(screen.getByText(text)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });
});

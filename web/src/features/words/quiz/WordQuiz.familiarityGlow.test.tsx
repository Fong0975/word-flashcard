import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { apiService } from '../../../lib/api';
import { FAMILIARITY_LABELS } from '../../shared/constants/familiarity';

import { WordQuiz } from './WordQuiz';

const GREEN_LABEL = FAMILIARITY_LABELS[FamiliarityLevel.GREEN];

// Companion to WordQuiz.test.tsx, split out to stay under the project's
// max-lines limit. Covers the familiarity reported for the card glow and
// shown on the familiarity bar as the quiz moves between words and stages.

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.GREEN,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

const noop = () => {};

describe('WordQuiz familiarity glow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the glow familiarity: nothing while loading, the word level, the level being submitted, then the saved rating when navigating back', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getRandomWords').mockResolvedValue([
      buildWord({ id: 1, word: 'apple', familiarity: FamiliarityLevel.RED }),
      buildWord({
        id: 2,
        word: 'banana',
        familiarity: FamiliarityLevel.YELLOW,
      }),
    ]);
    let resolveUpdate: (value: Word) => void = () => {};
    vi.spyOn(apiService, 'updateWordFields').mockReturnValue(
      new Promise<Word>(resolve => {
        resolveUpdate = resolve;
      }),
    );
    const onFamiliarityGlowChange = vi.fn();

    const { unmount } = render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.RED]}
        questionCount={2}
        onQuizComplete={noop}
        onBackToHome={noop}
        onFamiliarityGlowChange={onFamiliarityGlowChange}
      />,
    );

    expect(onFamiliarityGlowChange).toHaveBeenLastCalledWith(undefined);

    // The glow is reported from a passive effect, which React may flush after
    // the commit that makes the heading findable, so these wait for it.
    await screen.findByRole('heading', { name: 'apple' });
    await waitFor(() =>
      expect(onFamiliarityGlowChange).toHaveBeenLastCalledWith(
        FamiliarityLevel.RED,
      ),
    );
    expect(screen.getByText('Familiarity: red')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    await user.click(screen.getByRole('button', { name: GREEN_LABEL }));
    expect(onFamiliarityGlowChange).toHaveBeenLastCalledWith(
      FamiliarityLevel.GREEN,
    );

    resolveUpdate(buildWord());
    await screen.findByRole('heading', { name: 'banana' });
    await waitFor(() =>
      expect(onFamiliarityGlowChange).toHaveBeenLastCalledWith(
        FamiliarityLevel.YELLOW,
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await screen.findByRole('heading', { name: 'apple' });
    expect(onFamiliarityGlowChange).toHaveBeenLastCalledWith(
      FamiliarityLevel.GREEN,
    );
    expect(screen.getByText('Familiarity: green')).toBeInTheDocument();
    expect(screen.getByTestId('familiarity-bar')).toHaveClass(
      'glass-glow-green',
    );

    unmount();
    expect(onFamiliarityGlowChange).toHaveBeenLastCalledWith(undefined);
  });
});

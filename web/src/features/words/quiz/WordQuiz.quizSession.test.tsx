import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { apiService } from '../../../lib/api';

import { WordQuiz } from './WordQuiz';

// Companion to WordQuiz.test.tsx, split out to stay under the project's
// max-lines limit. Covers the quiz_session_id sent with each familiarity
// submission, in particular that resubmitting an already-answered word
// after navigating back reuses the same session id.

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

describe('WordQuiz quiz_session_id', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the same quiz_session_id when resubmitting a familiarity after navigating back', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getRandomWords')
      .mockResolvedValue([
        buildWord({ id: 1, word: 'apple' }),
        buildWord({ id: 2, word: 'banana' }),
      ]);
    const updateSpy = jest
      .spyOn(apiService, 'updateWordFields')
      .mockResolvedValue(buildWord());

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={2}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    await user.click(screen.getByRole('button', { name: 'Familiar' }));

    await screen.findByRole('heading', { name: 'banana' });
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Unfamiliar' }));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(2));

    const firstSessionId = updateSpy.mock.calls[0][1].quiz_session_id;
    const secondSessionId = updateSpy.mock.calls[1][1].quiz_session_id;

    expect(firstSessionId).toEqual(expect.any(String));
    expect(secondSessionId).toBe(firstSessionId);
  });
});

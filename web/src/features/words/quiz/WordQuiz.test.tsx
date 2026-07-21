import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { apiService } from '../../../lib/api';

import { WordQuiz } from './WordQuiz';

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

describe('WordQuiz', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('shows the loading screen while words are being fetched', () => {
    jest
      .spyOn(apiService, 'getRandomWords')
      .mockReturnValue(new Promise<Word[]>(() => {}));

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    expect(screen.getByText('Loading Quiz')).toBeInTheDocument();
  });

  it('shows an error screen when fetching words fails, and Try Again dismisses it', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getRandomWords')
      .mockRejectedValue(new Error('network down'));

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    expect(await screen.findByText('network down')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.queryByText('network down')).not.toBeInTheDocument();
  });

  it('renders the current word during the question stage and reveals the rating UI after Show Answer', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getRandomWords').mockResolvedValue([buildWord()]);

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: 'apple' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Unfamiliar' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show Answer' }));

    expect(
      screen.getByRole('button', { name: 'Unfamiliar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Somewhat Familiar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Familiar' }),
    ).toBeInTheDocument();
  });

  it('submits a familiarity rating, sends the reminder note when enabled, and advances to the next word', async () => {
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

    await user.click(
      screen.getByRole('checkbox', { name: 'Set a reminder note' }),
    );
    await user.type(
      screen.getByPlaceholderText('Enter reminder note...'),
      'Remember this one',
    );

    await user.click(screen.getByRole('button', { name: 'Familiar' }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith(1, {
        word: 'apple',
        familiarity: FamiliarityLevel.GREEN,
        increment_count_practise: true,
        quiz_session_id: expect.any(String),
        reminder: 'Remember this one',
      }),
    );

    expect(
      await screen.findByRole('heading', { name: 'banana' }),
    ).toBeInTheDocument();
  });

  it('omits the reminder field when no reminder note is set', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getRandomWords').mockResolvedValue([buildWord()]);
    const updateSpy = jest
      .spyOn(apiService, 'updateWordFields')
      .mockResolvedValue(buildWord());

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    await user.click(screen.getByRole('button', { name: 'Unfamiliar' }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith(1, {
        word: 'apple',
        familiarity: FamiliarityLevel.RED,
        increment_count_practise: true,
        quiz_session_id: expect.any(String),
      }),
    );
  });

  it('shows an error and does not advance when the familiarity update request fails', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getRandomWords').mockResolvedValue([buildWord()]);
    jest
      .spyOn(apiService, 'updateWordFields')
      .mockRejectedValue(new Error('update failed'));
    const onError = jest.fn();

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
        onError={onError}
      />,
    );

    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    await user.click(screen.getByRole('button', { name: 'Familiar' }));

    expect(await screen.findByText('update failed')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      'Failed to update word familiarity: update failed',
    );
  });

  it('completes the quiz after rating the last word and calls onQuizComplete', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getRandomWords')
      .mockResolvedValue([
        buildWord({ id: 1, word: 'apple', familiarity: FamiliarityLevel.RED }),
      ]);
    jest.spyOn(apiService, 'updateWordFields').mockResolvedValue(buildWord());
    const onQuizComplete = jest.fn();

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.RED]}
        questionCount={1}
        onQuizComplete={onQuizComplete}
        onBackToHome={noop}
      />,
    );

    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    await user.click(screen.getByRole('button', { name: 'Familiar' }));

    await waitFor(() =>
      expect(onQuizComplete).toHaveBeenCalledWith([
        expect.objectContaining({
          word: expect.objectContaining({ id: 1, word: 'apple' }),
          oldFamiliarity: FamiliarityLevel.RED,
          newFamiliarity: FamiliarityLevel.GREEN,
        }),
      ]),
    );
    expect(await screen.findByText('Quiz Completed')).toBeInTheDocument();
  });

  it('defaults to maintaining familiarity and advances without an API call when Next is pressed without rating', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getRandomWords').mockResolvedValue([
      buildWord({
        id: 1,
        word: 'apple',
        familiarity: FamiliarityLevel.YELLOW,
      }),
      buildWord({ id: 2, word: 'banana' }),
    ]);
    const updateSpy = jest.spyOn(apiService, 'updateWordFields');

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.YELLOW]}
        questionCount={2}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByRole('heading', { name: 'banana' }),
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('disables quiz buttons while a familiarity update is pending, ignores a repeat click, and re-enables them after it resolves', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getRandomWords')
      .mockResolvedValue([
        buildWord({ id: 1, word: 'apple' }),
        buildWord({ id: 2, word: 'banana' }),
      ]);
    let resolveUpdate: (value: Word) => void = () => {};
    const updatePromise = new Promise<Word>(resolve => {
      resolveUpdate = resolve;
    });
    const updateSpy = jest
      .spyOn(apiService, 'updateWordFields')
      .mockReturnValue(updatePromise);

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
    const familiarButton = screen.getByRole('button', { name: 'Familiar' });
    await user.click(familiarButton);
    await user.click(familiarButton);

    expect(screen.getByRole('button', { name: 'Unfamiliar' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Somewhat Familiar' }),
    ).toBeDisabled();
    expect(familiarButton).toBeDisabled();
    expect(updateSpy).toHaveBeenCalledTimes(1);

    resolveUpdate(buildWord());

    await screen.findByRole('heading', { name: 'banana' });

    expect(
      screen.getByRole('button', { name: 'Show Answer' }),
    ).not.toBeDisabled();
  });

  it('resets the processing state so buttons are re-enabled after a failed familiarity update', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getRandomWords').mockResolvedValue([buildWord()]);
    jest
      .spyOn(apiService, 'updateWordFields')
      .mockRejectedValue(new Error('update failed'));

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    await user.click(screen.getByRole('button', { name: 'Familiar' }));

    await screen.findByText('update failed');
    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByRole('button', { name: 'Familiar' })).not.toBeDisabled();
  });

  it('returns to the question stage when Previous is pressed from the answer stage, without an API call', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getRandomWords').mockResolvedValue([buildWord()]);
    const updateSpy = jest.spyOn(apiService, 'updateWordFields');

    render(
      <WordQuiz
        selectedFamiliarity={[FamiliarityLevel.GREEN]}
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    await screen.findByRole('heading', { name: 'apple' });
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    expect(
      screen.getByRole('button', { name: 'Familiar' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    expect(
      screen.getByRole('button', { name: 'Show Answer' }),
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

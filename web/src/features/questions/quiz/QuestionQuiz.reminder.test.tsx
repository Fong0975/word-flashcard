import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { Question } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { QuestionQuiz } from './QuestionQuiz';
import { buildQuestion, lastNextAction, noop } from './questionQuizTestHelpers';

describe('QuestionQuiz reminder note', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Makes every shuffle swap a no-op, so the answer key is predictable.
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  /** Renders a quiz and answers its first question, reaching the review stage. */
  const renderAndAnswer = async (
    questions: Question[],
    onQuizComplete: () => void = noop,
  ) => {
    const user = userEvent.setup();
    const onNextAction = vi.fn();
    vi.spyOn(apiService, 'getRandomQuestions').mockResolvedValue(questions);
    vi.spyOn(apiService, 'updateQuestion').mockResolvedValue(buildQuestion());

    render(
      <QuestionQuiz
        questionCount={questions.length}
        onQuizComplete={onQuizComplete}
        onBackToHome={noop}
        onNextAction={onNextAction}
      />,
    );
    await screen.findByRole('heading', { name: questions[0].question });
    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();
    await screen.findByRole('checkbox', { name: 'Set a reminder note' });
    // The footer action is reported from a passive effect, which can lag
    // behind the commit that makes the review stage findable.
    await waitFor(() =>
      expect(lastNextAction(onNextAction)).toMatchObject({
        label: expect.stringMatching(/Next Question|Finish Quiz/),
        loading: false,
      }),
    );

    const typeReminder = async (text: string) => {
      await user.click(
        screen.getByRole('checkbox', { name: 'Set a reminder note' }),
      );
      await user.type(
        screen.getByPlaceholderText('Enter reminder note...'),
        text,
      );
    };

    return { user, onNextAction, typeReminder };
  };

  it.each([
    { name: 'the note is left off', text: undefined },
    { name: 'the note is blank', text: '   ' },
  ])('does not save a reminder when $name', async ({ text }) => {
    const reminderSpy = vi.spyOn(apiService, 'updateQuestionReminder');
    const onQuizComplete = vi.fn();
    const { onNextAction, typeReminder } = await renderAndAnswer(
      [buildQuestion()],
      onQuizComplete,
    );
    if (text !== undefined) {
      await typeReminder(text);
    }

    lastNextAction(onNextAction)!.onClick();

    await waitFor(() => expect(onQuizComplete).toHaveBeenCalled());
    expect(reminderSpy).not.toHaveBeenCalled();
  });

  it('saves the reminder before moving on, then starts the next one blank', async () => {
    const reminderSpy = vi
      .spyOn(apiService, 'updateQuestionReminder')
      .mockResolvedValue(buildQuestion());
    const { user, onNextAction, typeReminder } = await renderAndAnswer([
      buildQuestion({ id: 1, question: 'First?' }),
      buildQuestion({ id: 2, question: 'Second?' }),
    ]);
    await typeReminder('  check the tense  ');

    lastNextAction(onNextAction)!.onClick();

    expect(
      await screen.findByRole('heading', { name: 'Second?' }),
    ).toBeInTheDocument();
    expect(reminderSpy).toHaveBeenCalledWith(1, 'check the tense');

    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();

    expect(
      await screen.findByRole('checkbox', { name: 'Set a reminder note' }),
    ).not.toBeChecked();
    expect(screen.getByPlaceholderText('Enter reminder note...')).toHaveValue(
      '',
    );
  });

  it('stays on the question when saving the reminder fails, and allows a retry', async () => {
    const reminderSpy = vi
      .spyOn(apiService, 'updateQuestionReminder')
      .mockRejectedValueOnce(new Error('save failed'))
      .mockResolvedValueOnce(buildQuestion());
    const onQuizComplete = vi.fn();
    const { onNextAction, typeReminder } = await renderAndAnswer(
      [buildQuestion()],
      onQuizComplete,
    );
    await typeReminder('check the tense');

    lastNextAction(onNextAction)!.onClick();

    expect(
      await screen.findByText('Failed to save reminder: save failed'),
    ).toBeInTheDocument();
    expect(onQuizComplete).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('check the tense')).toBeEnabled();
    await waitFor(() =>
      expect(lastNextAction(onNextAction)).toMatchObject({
        label: 'Finish Quiz',
        loading: false,
      }),
    );

    lastNextAction(onNextAction)!.onClick();

    await waitFor(() => expect(onQuizComplete).toHaveBeenCalled());
    expect(reminderSpy).toHaveBeenCalledTimes(2);
  });
});

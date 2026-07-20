import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Question } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { QuestionQuiz, NextActionProps } from './QuestionQuiz';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'A',
  option_a: '4',
  option_b: '3',
  option_c: '5',
  option_d: '6',
  count_failure_practise: 0,
  count_practise: 0,
  notes: '',
  reference: '',
  ...overrides,
});

const noop = () => {};

const lastNextAction = (spy: jest.Mock): NextActionProps | null => {
  const { calls } = spy.mock;
  return calls.length > 0 ? calls[calls.length - 1][0] : null;
};

describe('QuestionQuiz', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // The shuffle is a real Fisher-Yates over Math.random(); mocking it to
    // return just under 1 makes every swap a no-op, so options keep their
    // original A/B/C/D order and the answer key is predictable.
    jest.spyOn(Math, 'random').mockReturnValue(0.999999);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('shows the loading screen while questions are being fetched', () => {
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockReturnValue(new Promise<Question[]>(() => {}));

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    expect(screen.getByText('Loading Quiz')).toBeInTheDocument();
  });

  it('shows an error screen with a Back to Home action', async () => {
    const user = userEvent.setup();
    const onBackToHome = jest.fn();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockRejectedValue(new Error('network down'));

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={onBackToHome}
      />,
    );

    expect(await screen.findByText('network down')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(onBackToHome).toHaveBeenCalled();
  });

  it('renders the question with its options in order', async () => {
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: 'What is 2 + 2?' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('reports Submit Answer, disabled until an option is chosen', async () => {
    const user = userEvent.setup();
    const onNextAction = jest.fn();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
        onNextAction={onNextAction}
      />,
    );
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    expect(lastNextAction(onNextAction)).toMatchObject({
      label: 'Submit Answer',
      disabled: true,
    });

    await user.click(screen.getAllByRole('radio')[0]);

    expect(lastNextAction(onNextAction)).toMatchObject({
      label: 'Submit Answer',
      disabled: false,
    });
  });

  it('submits the mapped-back answer, then reports Finish Quiz', async () => {
    const user = userEvent.setup();
    const onNextAction = jest.fn();
    const onQuizComplete = jest.fn();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);
    const updateSpy = jest
      .spyOn(apiService, 'updateQuestion')
      .mockResolvedValue(buildQuestion());

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={onQuizComplete}
        onBackToHome={noop}
        onNextAction={onNextAction}
      />,
    );
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith(1, {
        question: 'What is 2 + 2?',
        answer: 'A',
        option_a: '4',
        option_b: '3',
        option_c: '5',
        option_d: '6',
        notes: '',
        reference: '',
        count_practise: 1,
        count_failure_practise: 0,
        practiced: true,
        selected_option: 'A',
      }),
    );

    expect(await screen.findByText('✓ Correct')).toBeInTheDocument();
    expect(lastNextAction(onNextAction)).toMatchObject({
      label: 'Finish Quiz',
    });

    lastNextAction(onNextAction)!.onClick();

    expect(onQuizComplete).toHaveBeenCalledWith([
      {
        question: expect.objectContaining({ id: 1 }),
        userAnswer: 'A',
        isCorrect: true,
        updatedStats: { countPractise: 1, countFailurePractise: 0 },
      },
    ]);
  });

  it('advances to the next question and resets the selection', async () => {
    const user = userEvent.setup();
    const onNextAction = jest.fn();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([
        buildQuestion({ id: 1, question: 'First?' }),
        buildQuestion({ id: 2, question: 'Second?' }),
      ]);
    jest.spyOn(apiService, 'updateQuestion').mockResolvedValue(buildQuestion());

    render(
      <QuestionQuiz
        questionCount={2}
        onQuizComplete={noop}
        onBackToHome={noop}
        onNextAction={onNextAction}
      />,
    );
    await screen.findByRole('heading', { name: 'First?' });

    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();
    await waitFor(() =>
      expect(lastNextAction(onNextAction)).toMatchObject({
        label: 'Next Question',
      }),
    );

    lastNextAction(onNextAction)!.onClick();

    expect(
      await screen.findByRole('heading', { name: 'Second?' }),
    ).toBeInTheDocument();
    expect(lastNextAction(onNextAction)).toMatchObject({
      label: 'Submit Answer',
      disabled: true,
    });
  });

  it('shows an error and reports it via onError on failure', async () => {
    const user = userEvent.setup();
    const onNextAction = jest.fn();
    const onError = jest.fn();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);
    jest
      .spyOn(apiService, 'updateQuestion')
      .mockRejectedValue(new Error('update failed'));

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
        onNextAction={onNextAction}
        onError={onError}
      />,
    );
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();

    expect(await screen.findByText('update failed')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      'Failed to update question statistics: update failed',
    );
  });

  it('reports loading/disabled true while submitting, then loading false once it resolves', async () => {
    const user = userEvent.setup();
    const onNextAction = jest.fn();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);

    let resolveUpdate!: (value: Question) => void;
    const updatePromise = new Promise<Question>(resolve => {
      resolveUpdate = resolve;
    });
    jest.spyOn(apiService, 'updateQuestion').mockReturnValue(updatePromise);

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
        onNextAction={onNextAction}
      />,
    );
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();

    await waitFor(() =>
      expect(lastNextAction(onNextAction)).toMatchObject({
        label: 'Submit Answer',
        disabled: true,
        loading: true,
      }),
    );

    resolveUpdate(buildQuestion());

    await waitFor(() =>
      expect(lastNextAction(onNextAction)).toMatchObject({
        label: 'Finish Quiz',
        loading: false,
      }),
    );
  });

  it('ignores a second submission while one is already pending', async () => {
    const onNextAction = jest.fn();
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);
    const updateSpy = jest
      .spyOn(apiService, 'updateQuestion')
      .mockReturnValue(new Promise<Question>(() => {}));

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
        onNextAction={onNextAction}
      />,
    );
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();

    await waitFor(() =>
      expect(lastNextAction(onNextAction)).toMatchObject({ loading: true }),
    );

    lastNextAction(onNextAction)!.onClick();

    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it('resets the submitting state after a failure so the user can retry', async () => {
    const user = userEvent.setup();
    const onNextAction = jest.fn();
    jest
      .spyOn(apiService, 'getRandomQuestions')
      .mockResolvedValue([buildQuestion()]);
    const updateSpy = jest
      .spyOn(apiService, 'updateQuestion')
      .mockRejectedValueOnce(new Error('update failed'))
      .mockResolvedValueOnce(buildQuestion());

    render(
      <QuestionQuiz
        questionCount={1}
        onQuizComplete={noop}
        onBackToHome={noop}
        onNextAction={onNextAction}
      />,
    );
    await screen.findByRole('heading', { name: 'What is 2 + 2?' });

    await user.click(screen.getAllByRole('radio')[0]);
    lastNextAction(onNextAction)!.onClick();

    await waitFor(() =>
      expect(lastNextAction(onNextAction)).toMatchObject({
        label: 'Submit Answer',
        disabled: false,
        loading: false,
      }),
    );

    lastNextAction(onNextAction)!.onClick();

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(2));
  });
});

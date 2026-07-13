import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Question, QuestionAnswerLogEntry } from '../../../../types/api';
import { apiService } from '../../../../lib/api';

import { QuestionHistorySection } from './QuestionHistorySection';

const buildQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 1,
  question: 'What is 2 + 2?',
  answer: 'B',
  option_a: '3',
  option_b: '4',
  option_c: '5',
  notes: '',
  reference: '',
  count_practise: 0,
  count_failure_practise: 0,
  ...overrides,
});

const buildEntry = (
  overrides: Partial<QuestionAnswerLogEntry> = {},
): QuestionAnswerLogEntry => ({
  id: 1,
  selected_option: 'B',
  is_correct: true,
  created_at: '2026-07-10T10:00:00Z',
  ...overrides,
});

describe('QuestionHistorySection', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders collapsed by default and does not fetch', () => {
    const getQuestionLogsSpy = jest.spyOn(apiService, 'getQuestionLogs');

    render(<QuestionHistorySection question={buildQuestion()} />);

    expect(screen.getByText('Recent Answer History')).toBeInTheDocument();
    expect(getQuestionLogsSpy).not.toHaveBeenCalled();
  });

  it('fetches and renders entries and per-option counts when expanded', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestionLogs').mockResolvedValue([
      buildEntry({ id: 1, selected_option: 'B', is_correct: true }),
      buildEntry({
        id: 2,
        selected_option: 'A',
        is_correct: false,
        created_at: '2026-07-09T10:00:00Z',
      }),
      buildEntry({
        id: 3,
        selected_option: 'B',
        is_correct: true,
        created_at: '2026-07-08T10:00:00Z',
      }),
    ]);

    render(<QuestionHistorySection question={buildQuestion({ id: 42 })} />);

    await user.click(
      screen.getByRole('button', { name: 'Recent Answer History' }),
    );

    expect(apiService.getQuestionLogs).toHaveBeenCalledWith(42, 15);
    // "Correct"/"Incorrect" also appears once each as a chart legend label,
    // so assert at least as many occurrences as there are matching entries.
    expect(
      (await screen.findAllByText('Correct')).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Incorrect').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Option B').length).toBeGreaterThan(0);
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('shows a loading state while fetching', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: QuestionAnswerLogEntry[]) => void = () => {};
    jest.spyOn(apiService, 'getQuestionLogs').mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve;
      }),
    );

    render(<QuestionHistorySection question={buildQuestion()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Answer History' }),
    );

    expect(screen.getByText('Loading history...')).toBeInTheDocument();

    resolveFetch([]);
    expect(
      await screen.findByText('No answer history yet.'),
    ).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getQuestionLogs')
      .mockRejectedValue(new Error('network down'));

    render(<QuestionHistorySection question={buildQuestion()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Answer History' }),
    );

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('shows the empty state when there is no history', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestionLogs').mockResolvedValue([]);

    render(<QuestionHistorySection question={buildQuestion()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Answer History' }),
    );

    expect(
      await screen.findByText('No answer history yet.'),
    ).toBeInTheDocument();
  });
});

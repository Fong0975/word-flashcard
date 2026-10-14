import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

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
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('renders collapsed by default and does not fetch', () => {
    const getQuestionLogsSpy = vi.spyOn(apiService, 'getQuestionLogs');

    render(<QuestionHistorySection question={buildQuestion()} />);

    expect(screen.getByText('Recent Practice History')).toBeInTheDocument();
    expect(getQuestionLogsSpy).not.toHaveBeenCalled();
  });

  it('fetches and renders entries and per-option counts when expanded', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getQuestionLogs').mockResolvedValue([
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
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(apiService.getQuestionLogs).toHaveBeenCalledWith(42, 15);
    // "Correct"/"Incorrect" also appears once each as a chart legend label,
    // so assert at least as many occurrences as there are matching entries.
    expect(
      (await screen.findAllByText('Correct')).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Incorrect').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('(B) 4').length).toBeGreaterThan(0);
    expect(screen.getByText('(A) 3')).toBeInTheDocument();
  });

  it('shows the options chart by default and keeps the entry list when switching charts', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getQuestionLogs').mockResolvedValue([
      buildEntry({ id: 1, selected_option: 'B', is_correct: true }),
    ]);

    render(<QuestionHistorySection question={buildQuestion()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    const optionsTab = await screen.findByRole('button', { name: 'Options' });
    const trendTab = screen.getByRole('button', { name: 'Trend' });
    expect(optionsTab).toHaveAttribute('aria-pressed', 'true');
    expect(trendTab).toHaveAttribute('aria-pressed', 'false');
    expect(
      optionsTab.compareDocumentPosition(trendTab) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const tests = [
      { name: 'switch to trend', tab: trendTab },
      { name: 'switch back to options', tab: optionsTab },
    ];

    for (const tt of tests) {
      await user.click(tt.tab);

      expect(tt.tab, tt.name).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('(B) 4'), tt.name).toBeInTheDocument();
    }
  });

  it('formats the selected option with its text, falling back to the letter alone', async () => {
    const tests = [
      { name: 'option with text', selected: 'C', expected: '(C) 5' },
      { name: 'option without text', selected: 'D', expected: '(D)' },
    ];

    for (const tt of tests) {
      const user = userEvent.setup();
      vi.spyOn(apiService, 'getQuestionLogs').mockResolvedValue([
        buildEntry({ selected_option: tt.selected, is_correct: false }),
      ]);

      const { unmount } = render(
        <QuestionHistorySection question={buildQuestion()} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Recent Practice History' }),
      );

      expect(await screen.findByText(tt.expected), tt.name).toBeInTheDocument();
      unmount();
    }
  });

  it('shows a loading state while fetching', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: QuestionAnswerLogEntry[]) => void = () => {};
    vi.spyOn(apiService, 'getQuestionLogs').mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve;
      }),
    );

    render(<QuestionHistorySection question={buildQuestion()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(screen.getByText('Loading history...')).toBeInTheDocument();

    resolveFetch([]);
    expect(
      await screen.findByText('No practice history yet.'),
    ).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getQuestionLogs').mockRejectedValue(
      new Error('network down'),
    );

    render(<QuestionHistorySection question={buildQuestion()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('shows the empty state when there is no history', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getQuestionLogs').mockResolvedValue([]);

    render(<QuestionHistorySection question={buildQuestion()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(
      await screen.findByText('No practice history yet.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Trend' }),
    ).not.toBeInTheDocument();
  });
});

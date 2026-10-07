import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { Word, WordPracticeLogEntry } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { apiService } from '../../../../lib/api';
import { FAMILIARITY_LABELS } from '../../../shared/constants/familiarity';
import { formatDateTimeParts } from '../../../../utils/dateFormat';

import { WordHistorySection, familiarityLevel } from './WordHistorySection';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.YELLOW,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

const buildEntry = (
  overrides: Partial<WordPracticeLogEntry> = {},
): WordPracticeLogEntry => ({
  id: 1,
  familiarity: FamiliarityLevel.GREEN,
  previous_familiarity: FamiliarityLevel.YELLOW,
  created_at: '2026-07-10T10:00:00Z',
  ...overrides,
});

describe('WordHistorySection', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('renders collapsed by default and does not fetch', () => {
    const getWordLogsSpy = vi.spyOn(apiService, 'getWordLogs');

    render(<WordHistorySection word={buildWord()} />);

    expect(screen.getByText('Recent Practice History')).toBeInTheDocument();
    expect(getWordLogsSpy).not.toHaveBeenCalled();
  });

  it('fetches and renders entries when expanded', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getWordLogs').mockResolvedValue([
      buildEntry({ id: 1 }),
      buildEntry({
        id: 2,
        familiarity: FamiliarityLevel.YELLOW,
        previous_familiarity: FamiliarityLevel.RED,
        created_at: '2026-07-09T10:00:00Z',
      }),
    ]);

    render(<WordHistorySection word={buildWord({ id: 42 })} />);

    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(apiService.getWordLogs).toHaveBeenCalledWith(42, 10);
    expect(
      await screen.findAllByText(FAMILIARITY_LABELS[FamiliarityLevel.GREEN]),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText(FAMILIARITY_LABELS[FamiliarityLevel.YELLOW]),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText(FAMILIARITY_LABELS[FamiliarityLevel.RED]),
    ).not.toHaveLength(0);
  });

  it('shows the date and the time of an entry as separate lines', async () => {
    const user = userEvent.setup();
    const entry = buildEntry();
    vi.spyOn(apiService, 'getWordLogs').mockResolvedValue([entry]);

    render(<WordHistorySection word={buildWord()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    const { date, time } = formatDateTimeParts(entry.created_at);
    expect(await screen.findByText(time)).toBeInTheDocument();
    expect(screen.getAllByText(date)).not.toHaveLength(0);
  });

  it('shows a loading state while fetching', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: WordPracticeLogEntry[]) => void = () => {};
    vi.spyOn(apiService, 'getWordLogs').mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve;
      }),
    );

    render(<WordHistorySection word={buildWord()} />);
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
    vi.spyOn(apiService, 'getWordLogs').mockRejectedValue(
      new Error('network down'),
    );

    render(<WordHistorySection word={buildWord()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('shows the empty state when there is no history', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getWordLogs').mockResolvedValue([]);

    render(<WordHistorySection word={buildWord()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(
      await screen.findByText('No practice history yet.'),
    ).toBeInTheDocument();
  });
});

describe('familiarityLevel', () => {
  it('maps yellow to 1 and green to 2', () => {
    expect(familiarityLevel('yellow')).toBe(1);
    expect(familiarityLevel('green')).toBe(2);
  });

  it('falls back to 0 for red or any unrecognized value', () => {
    expect(familiarityLevel('red')).toBe(0);
    expect(familiarityLevel('unknown')).toBe(0);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word, WordPracticeLogEntry } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { apiService } from '../../../../lib/api';

import { WordHistorySection } from './WordHistorySection';

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
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders collapsed by default and does not fetch', () => {
    const getWordLogsSpy = jest.spyOn(apiService, 'getWordLogs');

    render(<WordHistorySection word={buildWord()} />);

    expect(screen.getByText('Recent Practice History')).toBeInTheDocument();
    expect(getWordLogsSpy).not.toHaveBeenCalled();
  });

  it('fetches and renders entries when expanded', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getWordLogs').mockResolvedValue([
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
    expect(await screen.findAllByText('green')).not.toHaveLength(0);
    expect(screen.getAllByText('yellow').length).toBeGreaterThan(0);
    expect(screen.getByText('red')).toBeInTheDocument();
  });

  it('shows a loading state while fetching', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: WordPracticeLogEntry[]) => void = () => {};
    jest.spyOn(apiService, 'getWordLogs').mockReturnValue(
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
    jest
      .spyOn(apiService, 'getWordLogs')
      .mockRejectedValue(new Error('network down'));

    render(<WordHistorySection word={buildWord()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('shows the empty state when there is no history', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getWordLogs').mockResolvedValue([]);

    render(<WordHistorySection word={buildWord()} />);
    await user.click(
      screen.getByRole('button', { name: 'Recent Practice History' }),
    );

    expect(
      await screen.findByText('No practice history yet.'),
    ).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { Word, WordPracticeLogEntry } from '../../../../types/api';
import { FamiliarityLevel } from '../../../../types/base';
import { apiService } from '../../../../lib/api';
import {
  FAMILIARITY_CHART_COLORS,
  FAMILIARITY_LABELS,
} from '../../../shared/constants/familiarity';
import { formatDateTimeParts } from '../../../../utils/dateFormat';

import {
  FamiliarityDot,
  WordHistorySection,
  buildHistoryChartData,
  familiarityLevel,
} from './WordHistorySection';

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

describe('buildHistoryChartData', () => {
  it.each([
    {
      name: 'returns no points when there is no history',
      logs: [],
      expected: [],
    },
    {
      name: 'leads a single practice with an unfamiliar starting point',
      logs: [
        buildEntry({
          familiarity: FamiliarityLevel.YELLOW,
          previous_familiarity: FamiliarityLevel.RED,
          created_at: '2026-07-10T10:00:00Z',
        }),
      ],
      expected: [
        { index: 0, level: 0, created_at: null },
        { index: 1, level: 1, created_at: '2026-07-10T10:00:00Z' },
      ],
    },
    {
      name: 'orders newest-first entries chronologically after the starting point',
      logs: [
        buildEntry({
          id: 2,
          familiarity: FamiliarityLevel.GREEN,
          previous_familiarity: FamiliarityLevel.YELLOW,
          created_at: '2026-07-11T10:00:00Z',
        }),
        buildEntry({
          id: 1,
          familiarity: FamiliarityLevel.YELLOW,
          previous_familiarity: FamiliarityLevel.RED,
          created_at: '2026-07-10T10:00:00Z',
        }),
      ],
      expected: [
        { index: 0, level: 0, created_at: null },
        { index: 1, level: 1, created_at: '2026-07-10T10:00:00Z' },
        { index: 2, level: 2, created_at: '2026-07-11T10:00:00Z' },
      ],
    },
    {
      name: 'starts unfamiliar even when the oldest entry previous level is not',
      logs: [
        buildEntry({
          familiarity: FamiliarityLevel.YELLOW,
          previous_familiarity: FamiliarityLevel.GREEN,
          created_at: '2026-07-10T10:00:00Z',
        }),
      ],
      expected: [
        { index: 0, level: 0, created_at: null },
        { index: 1, level: 1, created_at: '2026-07-10T10:00:00Z' },
      ],
    },
  ])('$name', ({ logs, expected }) => {
    expect(buildHistoryChartData(logs)).toEqual(expected);
  });
});

describe('FamiliarityDot', () => {
  it.each([
    {
      name: 'fills an unfamiliar point red',
      props: { cx: 10, cy: 20, payload: { level: 0 } },
      expected: {
        fill: FAMILIARITY_CHART_COLORS[FamiliarityLevel.RED],
        r: '4',
      },
    },
    {
      name: 'fills a learning point yellow',
      props: { cx: 10, cy: 20, payload: { level: 1 } },
      expected: {
        fill: FAMILIARITY_CHART_COLORS[FamiliarityLevel.YELLOW],
        r: '4',
      },
    },
    {
      name: 'fills a familiar point green',
      props: { cx: 10, cy: 20, payload: { level: 2 } },
      expected: {
        fill: FAMILIARITY_CHART_COLORS[FamiliarityLevel.GREEN],
        r: '4',
      },
    },
    {
      name: 'uses the given radius',
      props: { cx: 10, cy: 20, payload: { level: 2 }, radius: 6 },
      expected: {
        fill: FAMILIARITY_CHART_COLORS[FamiliarityLevel.GREEN],
        r: '6',
      },
    },
    {
      name: 'renders nothing without a position',
      props: { payload: { level: 2 } },
      expected: null,
    },
    {
      name: 'renders nothing without a payload',
      props: { cx: 10, cy: 20 },
      expected: null,
    },
  ])('$name', ({ props, expected }) => {
    const { container } = render(
      <svg>
        <FamiliarityDot {...props} />
      </svg>,
    );

    const circle = container.querySelector('circle');
    if (expected === null) {
      expect(circle).toBeNull();
      return;
    }
    expect(circle).toHaveAttribute('cx', '10');
    expect(circle).toHaveAttribute('cy', '20');
    expect(circle).toHaveAttribute('fill', expected.fill);
    expect(circle).toHaveAttribute('r', expected.r);
  });
});

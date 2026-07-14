import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordStatsResponse, WordTrendPoint } from '../../types/api';
import { apiService } from '../../lib/api';

import { WordStatsModal } from './WordStatsModal';

const buildStats = (
  overrides: Partial<WordStatsResponse> = {},
): WordStatsResponse => ({
  familiarity_distribution: { red: 1, yellow: 2, green: 3 },
  practice_count_distribution: [
    { range: '0', count: 4 },
    { range: '1-5', count: 5 },
  ],
  ...overrides,
});

const buildTrendPoint = (
  overrides: Partial<WordTrendPoint> = {},
): WordTrendPoint => ({
  date: '2026-07-10',
  practice_count: 0,
  improvement_rate: 0,
  avg_familiarity_score: 0,
  ...overrides,
});

describe('WordStatsModal', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(apiService, 'getWordsTrend').mockResolvedValue([]);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <WordStatsModal isOpen={false} onClose={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an error message when the stats request fails', async () => {
    jest
      .spyOn(apiService, 'getWordStats')
      .mockRejectedValue(new Error('network down'));

    render(<WordStatsModal isOpen onClose={jest.fn()} />);

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('shows the familiarity distribution by default', async () => {
    jest.spyOn(apiService, 'getWordStats').mockResolvedValue(buildStats());

    render(<WordStatsModal isOpen onClose={jest.fn()} />);

    expect(
      await screen.findByText('Familiarity distribution — 6 words total'),
    ).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('switches to the practice count tab when selected', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getWordStats').mockResolvedValue(buildStats());

    render(<WordStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Familiarity distribution — 6 words total');

    await user.click(screen.getByRole('button', { name: 'Practice Count' }));

    expect(
      screen.getByText('Practice count distribution — 6 words total'),
    ).toBeInTheDocument();
    expect(screen.getByText('Times practiced (per word)')).toBeInTheDocument();
  });

  it('switches to the trend tab and renders the chart when there is practice activity', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getWordStats').mockResolvedValue(buildStats());
    jest.spyOn(apiService, 'getWordsTrend').mockResolvedValue([
      buildTrendPoint({ date: '2026-07-09', practice_count: 2 }),
      buildTrendPoint({
        date: '2026-07-10',
        practice_count: 3,
        improvement_rate: 50,
        avg_familiarity_score: 60,
      }),
    ]);

    render(<WordStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Familiarity distribution — 6 words total');

    await user.click(screen.getByRole('button', { name: 'Trend' }));

    expect(apiService.getWordsTrend).toHaveBeenCalledWith(30);
    // recharts' ResponsiveContainer never measures a real size under jsdom,
    // so its children (Bar/Line/Legend) don't render text nodes here; assert
    // the component reached the "has activity" branch instead of the
    // loading/empty states.
    await waitFor(() => {
      expect(screen.queryByText('Loading trend...')).not.toBeInTheDocument();
    });
    expect(
      screen.queryByText('No recent practice activity.'),
    ).not.toBeInTheDocument();
  });

  it('shows the empty state on the trend tab when there is no practice activity', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getWordStats').mockResolvedValue(buildStats());
    jest
      .spyOn(apiService, 'getWordsTrend')
      .mockResolvedValue([
        buildTrendPoint(),
        buildTrendPoint({ date: '2026-07-11' }),
      ]);

    render(<WordStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Familiarity distribution — 6 words total');

    await user.click(screen.getByRole('button', { name: 'Trend' }));

    expect(
      await screen.findByText('No recent practice activity.'),
    ).toBeInTheDocument();
  });

  it('shows an error message on the trend tab when the trend request fails', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getWordStats').mockResolvedValue(buildStats());
    jest
      .spyOn(apiService, 'getWordsTrend')
      .mockRejectedValue(new Error('network down'));

    render(<WordStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Familiarity distribution — 6 words total');

    await user.click(screen.getByRole('button', { name: 'Trend' }));

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });
});

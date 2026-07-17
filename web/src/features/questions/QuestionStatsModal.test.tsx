import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuestionStatsResponse, QuestionTrendPoint } from '../../types/api';
import { apiService } from '../../lib/api';

import { CustomTooltip, QuestionStatsModal } from './QuestionStatsModal';

const buildTrendPoint = (
  overrides: Partial<QuestionTrendPoint> = {},
): QuestionTrendPoint => ({
  date: '2026-07-10',
  practice_count: 0,
  accuracy_rate: 0,
  ...overrides,
});

describe('QuestionStatsModal', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <QuestionStatsModal isOpen={false} onClose={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an error message when the stats request fails', async () => {
    jest
      .spyOn(apiService, 'getQuestionStats')
      .mockRejectedValue(new Error('network down'));

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('shows the total question count and the accuracy legend once loaded', async () => {
    const stats: QuestionStatsResponse = {
      accuracy_distribution: [
        { range: '80-100%', count: 5, practice_count_breakdown: [] },
        { range: '50-79%', count: 3, practice_count_breakdown: [] },
        { range: '0-49%', count: 1, practice_count_breakdown: [] },
        { range: 'N/A', count: 2, practice_count_breakdown: [] },
      ],
    };
    jest.spyOn(apiService, 'getQuestionStats').mockResolvedValue(stats);

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);

    expect(
      await screen.findByText('Accuracy distribution — 11 questions total'),
    ).toBeInTheDocument();
    expect(screen.getByText('80–100%')).toBeInTheDocument();
    expect(screen.getByText('50–79%')).toBeInTheDocument();
    expect(screen.getByText('0–49%')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders without crashing when a bucket range is the exact string "0%"', async () => {
    const stats: QuestionStatsResponse = {
      accuracy_distribution: [
        { range: '0%', count: 2, practice_count_breakdown: [] },
        { range: '80-100%', count: 5, practice_count_breakdown: [] },
      ],
    };
    jest.spyOn(apiService, 'getQuestionStats').mockResolvedValue(stats);

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);

    expect(
      await screen.findByText('Accuracy distribution — 7 questions total'),
    ).toBeInTheDocument();
  });

  it('renders without crashing when a bucket range does not start with a digit', async () => {
    const stats: QuestionStatsResponse = {
      accuracy_distribution: [
        { range: 'unknown', count: 1, practice_count_breakdown: [] },
      ],
    };
    jest.spyOn(apiService, 'getQuestionStats').mockResolvedValue(stats);

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);

    expect(
      await screen.findByText('Accuracy distribution — 1 questions total'),
    ).toBeInTheDocument();
  });

  it('switches to the trend tab and renders the chart when there is activity', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestionStats').mockResolvedValue({
      accuracy_distribution: [],
    });
    jest.spyOn(apiService, 'getQuestionsTrend').mockResolvedValue([
      buildTrendPoint({
        date: '2026-07-09',
        practice_count: 2,
        accuracy_rate: 50,
      }),
      buildTrendPoint({
        date: '2026-07-10',
        practice_count: 3,
        accuracy_rate: 66.7,
      }),
    ]);

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Accuracy distribution — 0 questions total');

    await user.click(screen.getByRole('button', { name: 'Trend' }));

    // recharts' ResponsiveContainer never measures a real size under jsdom,
    // so its children (Bar/Line/Legend) don't render text nodes here; assert
    // the component reached the "has activity" branch instead of asserting
    // on chart-internal text.
    expect(
      screen.queryByText('No recent answer activity.'),
    ).not.toBeInTheDocument();
    expect(apiService.getQuestionsTrend).toHaveBeenCalledWith(30);
  });

  it('switches back to the accuracy tab after viewing the trend tab', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestionStats').mockResolvedValue({
      accuracy_distribution: [
        { range: '80-100%', count: 5, practice_count_breakdown: [] },
      ],
    });
    jest
      .spyOn(apiService, 'getQuestionsTrend')
      .mockResolvedValue([buildTrendPoint()]);

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Accuracy distribution — 5 questions total');

    await user.click(screen.getByRole('button', { name: 'Trend' }));
    expect(
      screen.queryByText('Accuracy distribution — 5 questions total'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Accuracy' }));
    expect(
      await screen.findByText('Accuracy distribution — 5 questions total'),
    ).toBeInTheDocument();
  });

  it('shows the empty state on the trend tab when there is no answer activity', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestionStats').mockResolvedValue({
      accuracy_distribution: [],
    });
    jest
      .spyOn(apiService, 'getQuestionsTrend')
      .mockResolvedValue([
        buildTrendPoint(),
        buildTrendPoint({ date: '2026-07-11' }),
      ]);

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Accuracy distribution — 0 questions total');

    await user.click(screen.getByRole('button', { name: 'Trend' }));

    expect(
      await screen.findByText('No recent answer activity.'),
    ).toBeInTheDocument();
  });

  it('shows an error message on the trend tab when the trend request fails', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getQuestionStats').mockResolvedValue({
      accuracy_distribution: [],
    });
    jest
      .spyOn(apiService, 'getQuestionsTrend')
      .mockRejectedValue(new Error('trend network down'));

    render(<QuestionStatsModal isOpen onClose={jest.fn()} />);
    await screen.findByText('Accuracy distribution — 0 questions total');

    await user.click(screen.getByRole('button', { name: 'Trend' }));

    expect(await screen.findByText('trend network down')).toBeInTheDocument();
  });
});

describe('CustomTooltip', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(<CustomTooltip active={false} payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the question count without a breakdown section when all buckets are empty', () => {
    render(
      <CustomTooltip
        active
        payload={[
          {
            payload: {
              range: '81-90%',
              count: 4,
              practice_count_breakdown: [{ range: '0', count: 0 }],
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('81-90%: 4 questions')).toBeInTheDocument();
    expect(screen.queryByText('By practice count:')).not.toBeInTheDocument();
  });

  it('shows the practice count breakdown, omitting zero-count ranges', () => {
    render(
      <CustomTooltip
        active
        payload={[
          {
            payload: {
              range: '71-80%',
              count: 2,
              practice_count_breakdown: [
                { range: '0', count: 0 },
                { range: '1', count: 0 },
                { range: '2 ~ 4', count: 0 },
                { range: '5 ~ 9', count: 2 },
                { range: '10+', count: 0 },
              ],
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('71-80%: 2 questions')).toBeInTheDocument();
    expect(screen.getByText('By practice count:')).toBeInTheDocument();
    expect(screen.getByText('5 ~ 9')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('10+')).not.toBeInTheDocument();
  });
});

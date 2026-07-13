import { render, screen } from '@testing-library/react';

import { QuestionStatsResponse } from '../../types/api';
import { apiService } from '../../lib/api';

import { CustomTooltip, QuestionStatsModal } from './QuestionStatsModal';

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

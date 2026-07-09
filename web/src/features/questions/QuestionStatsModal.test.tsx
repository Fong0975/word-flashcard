import { render, screen } from '@testing-library/react';

import { QuestionStatsResponse } from '../../types/api';
import { apiService } from '../../lib/api';

import { QuestionStatsModal } from './QuestionStatsModal';

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
        { range: '80-100%', count: 5 },
        { range: '50-79%', count: 3 },
        { range: '0-49%', count: 1 },
        { range: 'N/A', count: 2 },
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

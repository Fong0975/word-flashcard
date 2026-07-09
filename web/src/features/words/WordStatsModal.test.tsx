import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordStatsResponse } from '../../types/api';
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

describe('WordStatsModal', () => {
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
});

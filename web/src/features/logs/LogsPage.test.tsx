import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { MockInstance } from 'vitest';

import { LogUnreadProvider } from '../../contexts/LogUnreadContext';
import { apiService } from '../../lib/api';
import { LogEntry } from '../../types/logs';

import { LogsPage } from './LogsPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

const buildEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 1,
  timestamp: new Date(2026, 7, 30, 20, 44, 13).toISOString(),
  level: 'INFO',
  source: 'main.go:49',
  message: 'Starting server',
  file: 'app.log',
  ...overrides,
});

const renderPage = (initialEntry = '/logs') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LogsPage />
    </MemoryRouter>,
  );

describe('LogsPage', () => {
  let getLogs: MockInstance;
  let getLogsCount: MockInstance;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    getLogs = vi
      .spyOn(apiService, 'getLogs')
      .mockResolvedValue([
        buildEntry({ id: 1, level: 'WARN', message: 'Disk almost full' }),
        buildEntry({ id: 2, level: 'INFO', message: 'Starting server' }),
      ]);
    getLogsCount = vi
      .spyOn(apiService, 'getLogsCount')
      .mockResolvedValue({ count: 2 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('loads and renders entries newest first', async () => {
    renderPage();

    expect(await screen.findByText('Disk almost full')).toBeInTheDocument();
    expect(screen.getByText('Starting server')).toBeInTheDocument();
  });

  it('shows the total entry count', async () => {
    getLogsCount.mockResolvedValue({ count: 137 });
    renderPage();

    expect(await screen.findByText('137 entries')).toBeInTheDocument();
  });

  it('requests the page named in the URL', async () => {
    getLogsCount.mockResolvedValue({ count: 500 });
    renderPage('/logs?page=3');

    await waitFor(() =>
      expect(getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 100 }),
      ),
    );
  });

  it('filters by level when a pill is toggled', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Disk almost full');

    await user.click(screen.getByRole('button', { name: 'ERROR' }));

    await waitFor(() =>
      expect(getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ levels: ['ERROR'] }),
      ),
    );
    expect(getLogsCount).toHaveBeenLastCalledWith(
      expect.objectContaining({ levels: ['ERROR'] }),
    );
  });

  it('filters by datetime range', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Disk almost full');

    await user.type(screen.getByLabelText('From'), '2026-08-01T09:00');

    await waitFor(() =>
      expect(getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ from: '2026-08-01T09:00' }),
      ),
    );
  });

  it('filters by keyword after the debounce delay', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Disk almost full');

    await user.type(screen.getByLabelText('Search logs'), 'disk');

    await waitFor(
      () =>
        expect(getLogs).toHaveBeenLastCalledWith(
          expect.objectContaining({ keyword: 'disk' }),
        ),
      { timeout: 1000 },
    );
    expect(getLogsCount).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: 'disk' }),
    );
  });

  it('refetches without changing the URL when the refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Disk almost full');
    getLogs.mockClear();

    await user.click(screen.getByRole('button', { name: 'Refresh logs' }));

    await waitFor(() => expect(getLogs).toHaveBeenCalledTimes(1));
  });

  it('renders an empty state when nothing matches', async () => {
    getLogs.mockResolvedValue([]);
    getLogsCount.mockResolvedValue({ count: 0 });
    renderPage();

    expect(await screen.findByText('No log entries')).toBeInTheDocument();
  });

  it('surfaces a load failure with a retry affordance', async () => {
    getLogs.mockRejectedValue(new Error('boom'));
    renderPage();

    expect(await screen.findByText('Error loading logs')).toBeInTheDocument();
  });

  // Pagination renders a nav for its responsive container plus a nested one
  // for the desktop page-number group, so these assert on the count rather
  // than a single element.
  it('hides pagination when everything fits on one page', async () => {
    renderPage();
    await screen.findByText('Disk almost full');

    expect(
      screen.queryAllByRole('navigation', { name: 'Pagination' }),
    ).toHaveLength(0);
  });

  it('shows pagination once the results span several pages', async () => {
    getLogsCount.mockResolvedValue({ count: 500 });
    renderPage();
    await screen.findByText('Disk almost full');

    await waitFor(() =>
      expect(
        screen.queryAllByRole('navigation', { name: 'Pagination' }).length,
      ).toBeGreaterThan(0),
    );
  });

  it('marks the logs read on open, clearing the unread indicator', async () => {
    const markLogsRead = vi
      .spyOn(apiService, 'markLogsRead')
      .mockResolvedValue({ last_read_at: '2026-08-31T09:00:00Z' });
    vi.spyOn(apiService, 'getUnreadLogsCount').mockResolvedValue({ count: 5 });

    render(
      <MemoryRouter initialEntries={['/logs']}>
        <LogUnreadProvider>
          <LogsPage />
        </LogUnreadProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(markLogsRead).toHaveBeenCalled());
  });

  it('navigates home from the back button', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Disk almost full');

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

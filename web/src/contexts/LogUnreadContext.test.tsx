import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { apiService } from '../lib/api';

import { LogUnreadProvider, useLogUnread } from './LogUnreadContext';

const Probe = () => {
  const { unreadCount, markRead } = useLogUnread();

  return (
    <div>
      <span data-testid='count'>{unreadCount}</span>
      <button type='button' onClick={() => void markRead()}>
        Mark read
      </button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <LogUnreadProvider>
      <Probe />
    </LogUnreadProvider>,
  );

describe('LogUnreadContext', () => {
  let getUnreadLogsCount: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    getUnreadLogsCount = vi
      .spyOn(apiService, 'getUnreadLogsCount')
      .mockResolvedValue({ count: 4 });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('fetches the unread count on mount', async () => {
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('count')).toHaveTextContent('4'),
    );
  });

  it('defaults to zero without a provider', () => {
    render(<Probe />);

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(getUnreadLogsCount).not.toHaveBeenCalled();
  });

  it('clears the count after marking read', async () => {
    const user = userEvent.setup();
    const markLogsRead = vi
      .spyOn(apiService, 'markLogsRead')
      .mockResolvedValue({ last_read_at: '2026-08-31T09:00:00Z' });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('count')).toHaveTextContent('4'),
    );

    await user.click(screen.getByRole('button', { name: 'Mark read' }));

    expect(markLogsRead).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('count')).toHaveTextContent('0'),
    );
  });

  it('logs a failed poll instead of surfacing it', async () => {
    // The indicator is non-critical, so a failure must not break rendering
    // or leave the app in an error state.
    getUnreadLogsCount.mockRejectedValue(new Error('offline'));
    renderProvider();

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('leaves the count alone when marking read fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'markLogsRead').mockRejectedValue(new Error('nope'));
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('count')).toHaveTextContent('4'),
    );

    await user.click(screen.getByRole('button', { name: 'Mark read' }));

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(screen.getByTestId('count')).toHaveTextContent('4');
  });

  it('re-polls on an interval', async () => {
    vi.useFakeTimers();
    renderProvider();

    // Flush the fetch kicked off on mount before advancing.
    await vi.advanceTimersByTimeAsync(0);
    expect(getUnreadLogsCount).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(getUnreadLogsCount).toHaveBeenCalledTimes(2);
  });
});

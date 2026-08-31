import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LogEntry } from '../../../types/logs';

import { LogEntryItem } from './LogEntryItem';

const buildEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 1,
  timestamp: new Date(2026, 7, 30, 20, 44, 13).toISOString(),
  level: 'INFO',
  source: 'main.go:49',
  message: 'Starting server',
  file: 'app.log',
  ...overrides,
});

describe('LogEntryItem', () => {
  it('renders the timestamp, level, source and message', () => {
    render(<LogEntryItem entry={buildEntry()} />);

    expect(screen.getByText('2026-08-30 20:44:13')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();
    expect(screen.getByText('main.go:49')).toBeInTheDocument();
    expect(screen.getByText('Starting server')).toBeInTheDocument();
  });

  it('keeps the attribute suffix verbatim, commas and brackets included', () => {
    const message =
      'Request processed [method=GET, path=/api/x?a=1, status=200]';
    render(<LogEntryItem entry={buildEntry({ message })} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('does not offer expansion for a single-line message', () => {
    render(<LogEntryItem entry={buildEntry()} />);

    expect(
      screen.queryByRole('button', { name: 'Show more' }),
    ).not.toBeInTheDocument();
  });

  it('collapses a multi-line message to its first line and expands on demand', async () => {
    const user = userEvent.setup();
    const message =
      'Panic recovered [stack=goroutine 1:\nmain.handler()\n\t/root/main.go:10';
    render(<LogEntryItem entry={buildEntry({ level: 'ERROR', message })} />);

    // Collapsed: the first line is shown, the rest of the trace is not.
    // Substring matching is used because getByText compares against
    // whitespace-normalized textContent, which a newline-bearing query
    // string could never equal.
    expect(
      screen.getByText('Panic recovered [stack=goroutine 1:'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/root\/main\.go:10/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByText(/root\/main\.go:10/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText(/root\/main\.go:10/)).not.toBeInTheDocument();
  });

  it.each(['DEBUG', 'INFO', 'WARN', 'ERROR'] as const)(
    'renders the %s badge',
    level => {
      render(<LogEntryItem entry={buildEntry({ level })} />);

      expect(screen.getByText(level)).toBeInTheDocument();
    },
  );
});

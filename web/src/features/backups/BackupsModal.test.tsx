import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { apiService } from '../../lib/api';
import { BackupFile } from '../../types/backups';

import { BackupsModal } from './BackupsModal';

const buildBackup = (overrides: Partial<BackupFile> = {}): BackupFile => ({
  name: 'word-flashcard-backup-20260101-000000.json',
  size_bytes: 2048,
  modified_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('BackupsModal', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <BackupsModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an error message when the request fails', async () => {
    vi.spyOn(apiService, 'getBackupFiles').mockRejectedValue(
      new Error('network down'),
    );

    render(<BackupsModal isOpen onClose={vi.fn()} />);

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });

  it('shows the empty state when there are no backup files', async () => {
    vi.spyOn(apiService, 'getBackupFiles').mockResolvedValue([]);

    render(<BackupsModal isOpen onClose={vi.fn()} />);

    expect(await screen.findByText('No backup files yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a table row per backup file, in the order returned by the API', async () => {
    vi.spyOn(apiService, 'getBackupFiles').mockResolvedValue([
      buildBackup({
        name: 'word-flashcard-backup-20260115-000000.json',
        size_bytes: 1536,
        modified_at: '2026-01-15T00:00:00Z',
      }),
      buildBackup({
        name: 'word-flashcard-backup-20260101-000000.json',
        size_bytes: 2 * 1024 * 1024,
        modified_at: '2026-01-01T00:00:00Z',
      }),
    ]);

    render(<BackupsModal isOpen onClose={vi.fn()} />);

    expect(
      await screen.findByText('word-flashcard-backup-20260115-000000'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('word-flashcard-backup-20260101-000000'),
    ).toBeInTheDocument();
    expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    // rows[0] is the header row.
    expect(rows[1]).toHaveTextContent('word-flashcard-backup-20260115-000000');
    expect(rows[2]).toHaveTextContent('word-flashcard-backup-20260101-000000');
  });

  it('does not show the .json extension in the Name column', async () => {
    vi.spyOn(apiService, 'getBackupFiles').mockResolvedValue([
      buildBackup({ name: 'word-flashcard-backup-20260101-000000.json' }),
    ]);

    render(<BackupsModal isOpen onClose={vi.fn()} />);

    expect(
      await screen.findByText('word-flashcard-backup-20260101-000000'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('word-flashcard-backup-20260101-000000.json'),
    ).not.toBeInTheDocument();
  });

  it('clicking Refresh re-fetches and shows the latest data', async () => {
    const user = userEvent.setup();
    const getBackupFiles = vi
      .spyOn(apiService, 'getBackupFiles')
      .mockResolvedValueOnce([buildBackup({ name: 'old-backup.json' })])
      .mockResolvedValueOnce([buildBackup({ name: 'new-backup.json' })]);

    render(<BackupsModal isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('old-backup')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Refresh backup list' }),
    );

    expect(await screen.findByText('new-backup')).toBeInTheDocument();
    expect(screen.queryByText('old-backup')).not.toBeInTheDocument();
    await waitFor(() => expect(getBackupFiles).toHaveBeenCalledTimes(2));
  });
});

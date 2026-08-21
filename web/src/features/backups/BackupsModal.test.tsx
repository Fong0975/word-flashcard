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

  it('links each backup file name to its download URL', async () => {
    vi.spyOn(apiService, 'getBackupFiles').mockResolvedValue([
      buildBackup({ name: 'word-flashcard-backup-20260101-000000.json' }),
    ]);

    render(<BackupsModal isOpen onClose={vi.fn()} />);

    const link = await screen.findByRole('link', {
      name: 'word-flashcard-backup-20260101-000000',
    });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining(
        '/data/backups/word-flashcard-backup-20260101-000000.json',
      ),
    );
    expect(link).toHaveAttribute(
      'download',
      'word-flashcard-backup-20260101-000000.json',
    );
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

  it('renders a "Backup Now" button', async () => {
    vi.spyOn(apiService, 'getBackupFiles').mockResolvedValue([]);

    render(<BackupsModal isOpen onClose={vi.fn()} />);

    expect(
      await screen.findByRole('button', { name: 'Backup Now' }),
    ).toBeInTheDocument();
  });

  it('clicking Backup Now triggers a backup then refetches the table', async () => {
    const user = userEvent.setup();
    const getBackupFiles = vi
      .spyOn(apiService, 'getBackupFiles')
      .mockResolvedValueOnce([buildBackup({ name: 'old-backup.json' })])
      .mockResolvedValueOnce([
        buildBackup({ name: 'old-backup.json' }),
        buildBackup({ name: 'new-backup.json' }),
      ]);
    const triggerBackup = vi
      .spyOn(apiService, 'triggerBackup')
      .mockResolvedValue(buildBackup({ name: 'new-backup.json' }));

    render(<BackupsModal isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('old-backup')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Backup Now' }));

    expect(triggerBackup).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('new-backup')).toBeInTheDocument();
    await waitFor(() => expect(getBackupFiles).toHaveBeenCalledTimes(2));
  });

  it('shows a success toast after creating a backup', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getBackupFiles').mockResolvedValue([]);
    vi.spyOn(apiService, 'triggerBackup').mockResolvedValue(buildBackup());

    render(<BackupsModal isOpen onClose={vi.fn()} />);
    await screen.findByText('No backup files yet.');

    await user.click(screen.getByRole('button', { name: 'Backup Now' }));

    expect(await screen.findByText('Backup created.')).toBeInTheDocument();
  });

  it('shows an error toast and does not refetch when triggering a backup fails', async () => {
    const user = userEvent.setup();
    const getBackupFiles = vi
      .spyOn(apiService, 'getBackupFiles')
      .mockResolvedValue([buildBackup()]);
    vi.spyOn(apiService, 'triggerBackup').mockRejectedValue(
      new Error('disk full'),
    );

    render(<BackupsModal isOpen onClose={vi.fn()} />);
    await screen.findByText('word-flashcard-backup-20260101-000000');

    await user.click(screen.getByRole('button', { name: 'Backup Now' }));

    expect(
      await screen.findByText('Backup failed: disk full'),
    ).toBeInTheDocument();
    expect(getBackupFiles).toHaveBeenCalledTimes(1);
  });

  it('disables the Backup Now button while the request is in flight', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'getBackupFiles').mockResolvedValue([]);
    let resolveTrigger: (value: BackupFile) => void;
    vi.spyOn(apiService, 'triggerBackup').mockReturnValue(
      new Promise<BackupFile>(resolve => {
        resolveTrigger = resolve;
      }),
    );

    render(<BackupsModal isOpen onClose={vi.fn()} />);
    await screen.findByText('No backup files yet.');

    const button = screen.getByRole('button', { name: 'Backup Now' });
    await user.click(button);

    expect(
      await screen.findByRole('button', { name: 'Backing Up…' }),
    ).toBeDisabled();

    resolveTrigger!(buildBackup());

    expect(
      await screen.findByRole('button', { name: 'Backup Now' }),
    ).not.toBeDisabled();
  });
});

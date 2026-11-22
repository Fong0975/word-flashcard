import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BackupFile } from '../../types/backups';

import { BackupSizeCell } from './BackupSizeCell';

const buildBackup = (overrides: Partial<BackupFile> = {}): BackupFile => ({
  name: 'word-flashcard-backup-20260101-000000.json',
  size_bytes: 2048,
  modified_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('BackupSizeCell', () => {
  it.each([
    { name: 'bytes below 1 KB', bytes: 512, expected: '512 B' },
    { name: 'exactly 1 KB', bytes: 1024, expected: '1.0 KB' },
    { name: 'fractional KB', bytes: 1536, expected: '1.5 KB' },
    { name: 'MB', bytes: 2 * 1024 * 1024, expected: '2.0 MB' },
    { name: 'GB', bytes: 3 * 1024 ** 3, expected: '3.0 GB' },
    {
      name: 'capped at GB for larger sizes',
      bytes: 2048 * 1024 ** 3,
      expected: '2048.0 GB',
    },
  ])('formats $name', ({ bytes, expected }) => {
    const { container } = render(
      <BackupSizeCell backup={buildBackup({ size_bytes: bytes })} />,
    );

    expect(container).toHaveTextContent(expected);
  });

  it.each([
    {
      name: 'plural counts',
      summary: { words: 3, questions: 2, notes: 5 },
      expected: '3 words · 2 questions · 5 notes',
    },
    {
      name: 'singular counts',
      summary: { words: 1, questions: 1, notes: 1 },
      expected: '1 word · 1 question · 1 note',
    },
    {
      name: 'zero counts',
      summary: { words: 0, questions: 0, notes: 0 },
      expected: '0 words · 0 questions · 0 notes',
    },
  ])('shows $name in the tooltip on hover', async ({ summary, expected }) => {
    const user = userEvent.setup();
    render(<BackupSizeCell backup={buildBackup({ summary })} />);

    await user.hover(screen.getByRole('button', { name: 'Backup contents' }));

    expect(screen.getByRole('tooltip')).toHaveTextContent(expected);
  });

  it('shows no info trigger for a backup without a summary', () => {
    render(<BackupSizeCell backup={buildBackup()} />);

    expect(
      screen.queryByRole('button', { name: 'Backup contents' }),
    ).not.toBeInTheDocument();
  });
});

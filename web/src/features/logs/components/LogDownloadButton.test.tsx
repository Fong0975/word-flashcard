import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiService } from '../../../lib/api';

import { LogDownloadButton } from './LogDownloadButton';

describe('LogDownloadButton', () => {
  let savedAs: string | undefined;

  beforeEach(() => {
    savedAs = undefined;
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      savedAs = this.download;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getButton = () => screen.getByRole('button', { name: 'Download logs' });

  it.each([
    {
      name: 'saves a zip archive when the backend sends several files',
      type: 'application/zip',
      expectedName: /^word-flashcard-logs-.+\.zip$/,
    },
    {
      name: 'saves a .log file when the backend sends a single file',
      type: 'text/plain; charset=utf-8',
      expectedName: /^word-flashcard-logs-.+\.log$/,
    },
    {
      name: 'falls back to .log when the response has no type',
      type: '',
      expectedName: /^word-flashcard-logs-.+\.log$/,
    },
  ])('$name', async ({ type, expectedName }) => {
    const user = userEvent.setup();
    const blob = new Blob(['content'], { type });
    const downloadLogs = vi
      .spyOn(apiService, 'downloadLogs')
      .mockResolvedValue(blob);

    render(<LogDownloadButton />);
    await user.click(getButton());

    await waitFor(() => expect(downloadLogs).toHaveBeenCalledTimes(1));
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(savedAs).toMatch(expectedName);
    expect(
      await screen.findByText('Log download completed.'),
    ).toBeInTheDocument();
  });

  it.each([
    {
      name: 'shows the error message when the download fails',
      rejection: new Error('No log files found'),
      expectedToast: 'Log download failed: No log files found',
    },
    {
      name: 'shows a generic message when the failure is not an Error',
      rejection: 'boom',
      expectedToast: 'Log download failed: Unknown error',
    },
  ])('$name', async ({ rejection, expectedToast }) => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'downloadLogs').mockRejectedValue(rejection);

    render(<LogDownloadButton />);
    await user.click(getButton());

    expect(await screen.findByText(expectedToast)).toBeInTheDocument();
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();
    expect(savedAs).toBeUndefined();
    expect(getButton()).toBeEnabled();
  });

  it('is disabled while a download is in flight, then re-enabled', async () => {
    const user = userEvent.setup();
    let resolveDownload: (blob: Blob) => void = () => {};
    const downloadLogs = vi.spyOn(apiService, 'downloadLogs').mockReturnValue(
      new Promise<Blob>(resolve => {
        resolveDownload = resolve;
      }),
    );

    render(<LogDownloadButton />);
    await user.click(getButton());

    await waitFor(() => expect(getButton()).toBeDisabled());
    expect(getButton()).toHaveAttribute('aria-busy', 'true');
    expect(downloadLogs).toHaveBeenCalledTimes(1);

    resolveDownload(new Blob(['content'], { type: 'text/plain' }));

    await waitFor(() => expect(getButton()).toBeEnabled());
  });
});

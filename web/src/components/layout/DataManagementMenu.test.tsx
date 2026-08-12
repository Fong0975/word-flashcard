import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiService } from '../../lib/api';
import { DataExportPayload, ImportSummary } from '../../types/data-export';

import { DataManagementMenu } from './DataManagementMenu';

const samplePayload: DataExportPayload = {
  exported_at: '2024-01-15T10:00:00Z',
  words: [],
  word_definitions: [],
  questions: [],
  question_answer_logs: [],
  word_practice_logs: [],
  notes: [],
};

const sampleSummary: ImportSummary = {
  words: 1,
  word_definitions: 2,
  questions: 3,
  question_answer_logs: 4,
  word_practice_logs: 5,
  notes: 6,
};

const uploadFile = async (content: string) => {
  const user = userEvent.setup();
  const file = new File([content], 'export.json', {
    type: 'application/json',
  });
  const input = screen.getByLabelText('Import file');
  await user.upload(input, file);
};

describe('DataManagementMenu', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a settings button with a Data section and Import/Export items', () => {
    render(<DataManagementMenu />);

    expect(
      screen.getByRole('button', { name: 'Settings' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Import' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Export' }),
    ).toBeInTheDocument();
  });

  it('downloads the export and shows a success toast', async () => {
    const user = userEvent.setup();
    const exportSpy = vi
      .spyOn(apiService, 'exportData')
      .mockResolvedValue(samplePayload);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    render(<DataManagementMenu />);
    await user.click(screen.getByRole('menuitem', { name: 'Export' }));

    await waitFor(() => expect(exportSpy).toHaveBeenCalledTimes(1));
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Export completed.')).toBeInTheDocument();
  });

  it('shows an error toast when export fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'exportData').mockRejectedValue(
      new Error('network down'),
    );

    render(<DataManagementMenu />);
    await user.click(screen.getByRole('menuitem', { name: 'Export' }));

    expect(
      await screen.findByText('Export failed: network down'),
    ).toBeInTheDocument();
  });

  it('shows a confirmation dialog after selecting a valid export file', async () => {
    render(<DataManagementMenu />);

    await uploadFile(JSON.stringify(samplePayload));

    expect(await screen.findByText('Import Data')).toBeInTheDocument();
    expect(
      screen.getByText(/permanently replace ALL existing data/),
    ).toBeInTheDocument();
  });

  it('shows an error toast and no dialog when the selected file is not valid JSON', async () => {
    render(<DataManagementMenu />);

    await uploadFile('not valid json');

    expect(
      await screen.findByText(
        'Invalid file: could not parse it as a Flashcard export JSON file.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Import Data')).not.toBeInTheDocument();
  });

  it('cancelling the confirmation dialog does not call importData', async () => {
    const user = userEvent.setup();
    const importSpy = vi.spyOn(apiService, 'importData');

    render(<DataManagementMenu />);
    await uploadFile(JSON.stringify(samplePayload));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(importSpy).not.toHaveBeenCalled();
    expect(screen.queryByText('Import Data')).not.toBeInTheDocument();
  });

  it('confirming the dialog restores the data and shows a summary toast', async () => {
    const user = userEvent.setup();
    const importSpy = vi
      .spyOn(apiService, 'importData')
      .mockResolvedValue(sampleSummary);

    render(<DataManagementMenu />);
    await uploadFile(JSON.stringify(samplePayload));
    await user.click(
      await screen.findByRole('button', { name: 'Replace All Data' }),
    );

    await waitFor(() => expect(importSpy).toHaveBeenCalledWith(samplePayload));
    expect(
      await screen.findByText(/Import completed — words: 1/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Import Data')).not.toBeInTheDocument();
  });

  it('shows an error toast and keeps the dialog open when import fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'importData').mockRejectedValue(
      new Error('restore failed'),
    );

    render(<DataManagementMenu />);
    await uploadFile(JSON.stringify(samplePayload));
    await user.click(
      await screen.findByRole('button', { name: 'Replace All Data' }),
    );

    expect(
      await screen.findByText('Import failed: restore failed'),
    ).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
  });
});

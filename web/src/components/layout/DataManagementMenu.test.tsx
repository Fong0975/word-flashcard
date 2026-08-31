import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { LogUnreadProvider } from '../../contexts/LogUnreadContext';
import { apiService } from '../../lib/api';
import { DataExportPayload, ImportSummary } from '../../types/data-export';

import { DataManagementMenu } from './DataManagementMenu';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

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

// The menu navigates to the log viewer, so it must be rendered inside a
// router.
const renderMenu = () =>
  render(
    <MemoryRouter>
      <DataManagementMenu />
    </MemoryRouter>,
  );

// Rendering inside a real provider (rather than mocking the hook) so the
// indicator is exercised through the same unread endpoint the app uses.
const renderMenuWithUnread = (count: number) => {
  vi.spyOn(apiService, 'getUnreadLogsCount').mockResolvedValue({ count });

  return render(
    <MemoryRouter>
      <LogUnreadProvider>
        <DataManagementMenu />
      </LogUnreadProvider>
    </MemoryRouter>,
  );
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
    // restoreAllMocks does not reset a plain vi.fn(), so the navigate spy is
    // cleared explicitly between cases.
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a settings button with a Data section and Import/Export/Backups items', () => {
    renderMenu();

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
    expect(
      screen.getByRole('menuitem', { name: 'Backups' }),
    ).toBeInTheDocument();
  });

  it('opens the backups modal and loads the list when the Backups item is clicked', async () => {
    const user = userEvent.setup();
    const backupsSpy = vi
      .spyOn(apiService, 'getBackupFiles')
      .mockResolvedValue([]);

    renderMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Backups' }));

    expect(
      await screen.findByRole('heading', { name: 'Backups' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(backupsSpy).toHaveBeenCalledTimes(1));
  });

  it('downloads the export and shows a success toast', async () => {
    const user = userEvent.setup();
    const exportSpy = vi
      .spyOn(apiService, 'exportData')
      .mockResolvedValue(samplePayload);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    renderMenu();
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

    renderMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Export' }));

    expect(
      await screen.findByText('Export failed: network down'),
    ).toBeInTheDocument();
  });

  it('shows a confirmation dialog after selecting a valid export file', async () => {
    renderMenu();

    await uploadFile(JSON.stringify(samplePayload));

    expect(await screen.findByText('Import Data')).toBeInTheDocument();
    expect(
      screen.getByText(/permanently replace ALL existing data/),
    ).toBeInTheDocument();
  });

  it('shows an error toast and no dialog when the selected file is not valid JSON', async () => {
    renderMenu();

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

    renderMenu();
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

    renderMenu();
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

    renderMenu();
    await uploadFile(JSON.stringify(samplePayload));
    await user.click(
      await screen.findByRole('button', { name: 'Replace All Data' }),
    );

    expect(
      await screen.findByText('Import failed: restore failed'),
    ).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
  });

  it('renders a System section with a Logs item', () => {
    renderMenu();

    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Logs' })).toBeInTheDocument();
  });

  it('navigates to the log viewer when Logs is clicked', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Logs' }));

    expect(mockNavigate).toHaveBeenCalledWith('/logs');
  });

  it('shows no unread indicator when the log is caught up', async () => {
    renderMenuWithUnread(0);

    await waitFor(() =>
      expect(apiService.getUnreadLogsCount).toHaveBeenCalled(),
    );
    expect(
      screen.getByRole('button', { name: 'Settings' }),
    ).toBeInTheDocument();
  });

  it('marks the settings trigger when unread entries are waiting', async () => {
    renderMenuWithUnread(3);

    expect(
      await screen.findByRole('button', { name: 'Settings (unread logs)' }),
    ).toBeInTheDocument();
  });
});

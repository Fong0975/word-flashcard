import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Note } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { NoteDetailPage } from './NoteDetailPage';

const mockNavigate = jest.fn();
let mockParams: { id?: string } = { id: '1' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// The delete-confirmation message wraps the note title in a <strong>, so its
// text is split across elements; RTL's default string matcher can't see
// across that split, hence a matcher function keyed on the full textContent.
const hasFullText = (text: string) => (_: string, element: Element | null) =>
  element?.textContent === text;

const buildNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: 'My note',
  content: 'Some content',
  sort_order: 0,
  updated_at: '2026-07-10T10:00:00Z',
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <NoteDetailPage />
    </MemoryRouter>,
  );

describe('NoteDetailPage', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockParams = { id: '1' };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // DetailPageLayout renders the real Header, whose useDarkMode hook reads
    // window.matchMedia; jsdom doesn't implement it, so stub it out.
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('shows a loading spinner while fetching', () => {
    jest
      .spyOn(apiService, 'getNote')
      .mockReturnValue(new Promise<Note>(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('navigates back when the header back button is clicked while loading', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'getNote')
      .mockReturnValue(new Promise<Note>(() => {}));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes');
  });

  it('does not fetch the note when there is no id in the route', () => {
    mockParams = { id: undefined };
    const getNoteSpy = jest.spyOn(apiService, 'getNote');

    renderPage();

    expect(getNoteSpy).not.toHaveBeenCalled();
  });

  it('shows a not-found screen and navigates back on failure', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockRejectedValue(new Error('note gone'));

    renderPage();

    expect(await screen.findByText('note gone')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Notes' }));

    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes');
  });

  it('navigates back when the header back button is clicked on the error screen', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockRejectedValue(new Error('note gone'));

    renderPage();

    await screen.findByText('note gone');

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes');
  });

  it('renders the note title, content, and updated date', async () => {
    jest
      .spyOn(apiService, 'getNote')
      .mockResolvedValue(buildNote({ updated_at: '2026-07-10T10:00:00Z' }));

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'My note' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Some content')).toBeInTheDocument();
    expect(screen.getByText(/^Updated:/)).toBeInTheDocument();
  });

  it('shows a "-" fallback when the note has no updated date', async () => {
    jest
      .spyOn(apiService, 'getNote')
      .mockResolvedValue(buildNote({ updated_at: null }));

    renderPage();

    expect(await screen.findByText('Updated: -')).toBeInTheDocument();
  });

  it('navigates back when the header back button is clicked on the normal render', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes');
  });

  it('shows a placeholder when the note has no content', async () => {
    jest
      .spyOn(apiService, 'getNote')
      .mockResolvedValue(buildNote({ content: null }));

    renderPage();

    expect(
      await screen.findByText('No content yet. Click Edit to add content.'),
    ).toBeInTheDocument();
  });

  it('edits and saves changes to the note', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());
    const updateSpy = jest
      .spyOn(apiService, 'updateNote')
      .mockResolvedValue(
        buildNote({ title: 'Updated title', content: 'Updated content' }),
      );

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const titleInput = screen.getByPlaceholderText('Note title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');

    const contentInput = screen.getByPlaceholderText('Write your note...');
    await user.clear(contentInput);
    await user.type(contentInput, 'Updated content');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith(1, {
        title: 'Updated title',
        content: 'Updated content',
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Updated title' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Updated content')).toBeInTheDocument();
  });

  it('disables Save while editing when the title is cleared', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const titleInput = screen.getByPlaceholderText('Note title');
    await user.clear(titleInput);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('cancels editing without saving', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());
    const updateSpy = jest.spyOn(apiService, 'updateNote');

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const titleInput = screen.getByPlaceholderText('Note title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Discarded title');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByRole('heading', { name: 'My note' }),
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('shows a save error and stays in edit mode on failure', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());
    jest
      .spyOn(apiService, 'updateNote')
      .mockRejectedValue(new Error('save failed'));

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('save failed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Note title')).toBeInTheDocument();
  });

  it('deletes the note after confirming, and navigates back', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());
    const deleteSpy = jest
      .spyOn(apiService, 'deleteNote')
      .mockResolvedValue(undefined);

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });

    // Opening the confirmation leaves two "Delete" buttons on screen: the
    // header action and the inline confirm button.
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(
      screen.getByText(hasFullText('Delete "My note"? This cannot be undone.')),
    ).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(1));
    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes');
  });

  it('cancels the delete confirmation without deleting', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());
    const deleteSpy = jest.spyOn(apiService, 'deleteNote');

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.queryByText(
        hasFullText('Delete "My note"? This cannot be undone.'),
      ),
    ).not.toBeInTheDocument();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('shows a toast when deleting fails', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'getNote').mockResolvedValue(buildNote());
    jest
      .spyOn(apiService, 'deleteNote')
      .mockRejectedValue(new Error('delete failed'));

    renderPage();
    await screen.findByRole('heading', { name: 'My note' });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(
      await screen.findByText('Failed to delete note: delete failed'),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/?tab=notes');
  });
});

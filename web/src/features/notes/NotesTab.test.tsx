import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { EntityListHook } from '../../types';
import { Note } from '../../types/api';
import { apiService } from '../../lib/api';
import { useNotes } from '../../hooks/useNotes';

import { NotesTab } from './NotesTab';

jest.mock('../../hooks/useNotes');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

interface NotesHookOverrides extends Partial<EntityListHook<Note>> {
  notes?: Note[];
}

const buildNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: 'Note',
  content: null,
  sort_order: 1,
  updated_at: '2026-07-10T10:00:00Z',
  ...overrides,
});

const buildNotesHook = (overrides: NotesHookOverrides = {}) => {
  const notes = overrides.notes ?? [];
  return {
    entities: notes,
    notes,
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
    itemsPerPage: 30,
    searchTerm: '',
    totalCount: notes.length,
    fetchEntities: jest.fn().mockResolvedValue(undefined),
    fetchNotes: jest.fn().mockResolvedValue(undefined),
    nextPage: jest.fn().mockResolvedValue(undefined),
    previousPage: jest.fn().mockResolvedValue(undefined),
    goToPage: jest.fn().mockResolvedValue(undefined),
    goToFirst: jest.fn().mockResolvedValue(undefined),
    goToLast: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    setSearchTerm: jest.fn(),
    ...overrides,
  };
};

const renderTab = (overrides: NotesHookOverrides = {}) => {
  const hook = buildNotesHook(overrides);
  (useNotes as jest.Mock).mockReturnValue(hook);

  render(
    <MemoryRouter>
      <NotesTab />
    </MemoryRouter>,
  );

  return hook;
};

describe('NotesTab', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockNavigate.mockClear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('shows a bare spinner while first loading, with no notes yet', () => {
    renderTab({ loading: true, notes: [] });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Note Review')).not.toBeInTheDocument();
  });

  it('shows the error state and retries via refresh', async () => {
    const user = userEvent.setup();
    const { refresh } = renderTab({ error: 'Failed to load notes.' });

    expect(screen.getByText('Failed to load notes.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refresh).toHaveBeenCalled();
  });

  it('shows the "no notes yet" empty state', () => {
    renderTab({ notes: [] });

    expect(screen.getByText('No notes yet')).toBeInTheDocument();
  });

  it('shows the "no notes found" empty state for an empty search', () => {
    renderTab({ notes: [], searchTerm: 'xyz' });

    expect(screen.getByText('No notes found')).toBeInTheDocument();
    expect(
      screen.getByText('No notes match "xyz". Try a different search term.'),
    ).toBeInTheDocument();
  });

  it('renders notes and navigates to a note on click', async () => {
    const user = userEvent.setup();
    renderTab({
      notes: [
        buildNote({ id: 1, title: 'First note' }),
        buildNote({ id: 2, title: 'Second note' }),
      ],
    });

    await user.click(screen.getByText('First note'));

    expect(mockNavigate).toHaveBeenCalledWith('/note/1');
  });

  it('updates the search term while typing, and clears it', async () => {
    const user = userEvent.setup();
    const { setSearchTerm } = renderTab({
      notes: [buildNote()],
      searchTerm: 'foo',
    });

    await user.type(screen.getByPlaceholderText('Search notes...'), 'x');
    expect(setSearchTerm).toHaveBeenCalledWith('foox');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(setSearchTerm).toHaveBeenCalledWith('');
  });

  it('paginates via the Previous/Next buttons', async () => {
    const user = userEvent.setup();
    const { nextPage, previousPage } = renderTab({
      notes: [buildNote()],
      currentPage: 2,
      totalPages: 3,
      hasPrevious: true,
      hasNext: true,
    });

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(nextPage).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(previousPage).toHaveBeenCalled();
  });

  it('hides pagination controls when there is only one page', () => {
    renderTab({ notes: [buildNote()], totalPages: 1 });

    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('disables Move up on the first note, Move down on the last', () => {
    renderTab({
      notes: [
        buildNote({ id: 1, title: 'A' }),
        buildNote({ id: 2, title: 'B' }),
        buildNote({ id: 3, title: 'C' }),
      ],
    });

    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' });
    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move down',
    });

    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
    expect(moveUpButtons[1]).toBeEnabled();
    expect(moveDownButtons[0]).toBeEnabled();
  });

  it('moving a note up persists only the changed sort orders', async () => {
    const user = userEvent.setup();
    const updateSpy = jest
      .spyOn(apiService, 'updateNote')
      .mockResolvedValue(buildNote());
    renderTab({
      notes: [
        buildNote({ id: 1, title: 'A', sort_order: 1 }),
        buildNote({ id: 2, title: 'B', sort_order: 2 }),
        buildNote({ id: 3, title: 'C', sort_order: 3 }),
      ],
      currentPage: 1,
    });

    // Moving B up swaps A and B (new sort orders 1 and 2); C stays at 3 and
    // must not trigger a request.
    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' });
    await user.click(moveUpButtons[1]);

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(2));
    expect(updateSpy).toHaveBeenCalledWith(2, { sort_order: 1 });
    expect(updateSpy).toHaveBeenCalledWith(1, { sort_order: 2 });
    expect(updateSpy).not.toHaveBeenCalledWith(3, expect.anything());
  });

  it('reorders via drag and drop', async () => {
    const updateSpy = jest
      .spyOn(apiService, 'updateNote')
      .mockResolvedValue(buildNote());
    renderTab({
      notes: [
        buildNote({ id: 1, title: 'A', sort_order: 1 }),
        buildNote({ id: 2, title: 'B', sort_order: 2 }),
        buildNote({ id: 3, title: 'C', sort_order: 3 }),
      ],
      currentPage: 1,
    });

    // Drag events bubble, so firing them on the title text reaches the
    // draggable ancestor's handlers without reaching for `.closest()`.
    const cardA = screen.getByText('A');
    const cardC = screen.getByText('C');

    // Drag A to C's position: new order becomes [B, C, A].
    fireEvent.dragStart(cardA);
    fireEvent.dragOver(cardC);
    fireEvent.drop(cardC);
    fireEvent.dragEnd(cardA);

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(3));
    expect(updateSpy).toHaveBeenCalledWith(2, { sort_order: 1 }); // B: 2 -> 1
    expect(updateSpy).toHaveBeenCalledWith(3, { sort_order: 2 }); // C: 3 -> 2
    expect(updateSpy).toHaveBeenCalledWith(1, { sort_order: 3 }); // A: 1 -> 3
  });

  it('rolls back the order and shows an error toast on failure', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'updateNote')
      .mockRejectedValue(new Error('save failed'));
    renderTab({
      notes: [
        buildNote({ id: 1, title: 'A', sort_order: 1 }),
        buildNote({ id: 2, title: 'B', sort_order: 2 }),
      ],
      currentPage: 1,
    });

    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move down',
    });
    await user.click(moveDownButtons[0]);

    expect(await screen.findByText('save failed')).toBeInTheDocument();

    // Order reverts to the original hook data: A is first again, so its
    // "Move up" button should be disabled once more.
    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' });
    expect(moveUpButtons[0]).toBeDisabled();
  });
});

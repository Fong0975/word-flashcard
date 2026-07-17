import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Word, WordDefinition } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { apiService } from '../../../lib/api';
import { createExactWordSearchFilter } from '../word-form/utils';

import { WordDetailPage } from './WordDetailPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ wordText: 'apple' }),
}));

// WordFormModal has its own dedicated tests; here it's stubbed so these tests
// stay focused on WordDetailPage's own wiring: rename-then-navigate vs
// refetch-in-place.
jest.mock('../word-form', () => ({
  WordFormModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    onWordSaved?: (newWordText?: string) => void;
  }) =>
    !props.isOpen ? null : (
      <div>
        <span>Word Form Open</span>
        <button onClick={() => props.onWordSaved?.('brand new')}>
          Save Renamed
        </button>
        <button onClick={() => props.onWordSaved?.(undefined)}>
          Save Same
        </button>
        <button onClick={props.onClose}>Close Word Form</button>
      </div>
    ),
}));

// DefinitionFormModal has its own dedicated tests; here it's stubbed so these
// tests stay focused on the add/edit modal-state wiring and the fetchWord
// callbacks passed to it.
jest.mock('../definition-form', () => ({
  DefinitionFormModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    onDefinitionAdded?: () => void;
    onDefinitionUpdated?: () => void;
    mode?: string;
    definition?: WordDefinition | null;
  }) =>
    !props.isOpen ? null : (
      <div>
        <span>Definition Form Open: {props.mode}</span>
        <span>Editing: {props.definition ? props.definition.id : 'none'}</span>
        <button onClick={() => props.onDefinitionAdded?.()}>Confirm Add</button>
        <button onClick={() => props.onDefinitionUpdated?.()}>
          Confirm Update
        </button>
        <button onClick={props.onClose}>Close Definition Form</button>
      </div>
    ),
}));

const buildDefinition = (
  overrides: Partial<WordDefinition> = {},
): WordDefinition => ({
  id: 10,
  definition: 'a round fruit',
  examples: [],
  notes: '',
  part_of_speech: 'noun',
  phonetics: {},
  ...overrides,
});

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.YELLOW,
  reminder: null,
  count_practise: 0,
  definitions: [buildDefinition()],
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <WordDetailPage />
    </MemoryRouter>,
  );

describe('WordDetailPage', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockNavigate.mockClear();
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
      .spyOn(apiService, 'searchWords')
      .mockReturnValue(new Promise<Word[]>(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('fetches using an exact-match filter on the URL word text', async () => {
    const searchSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord()]);

    renderPage();

    await screen.findByRole('heading', { name: 'apple' });
    expect(searchSpy).toHaveBeenCalledWith({
      searchFilter: createExactWordSearchFilter('apple'),
      limit: 1,
    });
  });

  it('shows not-found and navigates home when no word matches', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Word not found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows an error and navigates home on fetch failure', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'searchWords')
      .mockRejectedValue(new Error('word gone'));

    renderPage();

    expect(await screen.findByText('word gone')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders word details and uses browser-back on success', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([buildWord()]);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'apple' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Word ID: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to new URL when the saved word was renamed', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([buildWord()]);

    renderPage();
    await screen.findByRole('heading', { name: 'apple' });

    await user.click(screen.getByRole('button', { name: 'Edit word' }));
    await user.click(screen.getByRole('button', { name: 'Save Renamed' }));

    expect(mockNavigate).toHaveBeenCalledWith('/word/brand%20new');
  });

  it('refetches in place when the saved word text is unchanged', async () => {
    const user = userEvent.setup();
    const searchSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord()]);

    renderPage();
    await screen.findByRole('heading', { name: 'apple' });
    expect(searchSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Edit word' }));
    await user.click(screen.getByRole('button', { name: 'Save Same' }));

    await waitFor(() => expect(searchSpy).toHaveBeenCalledTimes(2));
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.stringContaining('/word/'),
    );
  });

  it('deletes the word, navigates home, and does not refetch', async () => {
    const user = userEvent.setup();
    const searchSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord()]);
    const deleteSpy = jest
      .spyOn(apiService, 'deleteWord')
      .mockResolvedValue(undefined);

    renderPage();
    await screen.findByRole('heading', { name: 'apple' });

    await user.click(screen.getByRole('button', { name: 'Delete word' }));
    expect(
      screen.getByRole('heading', { name: 'Delete Word' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Word' }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(1));
    expect(mockNavigate).toHaveBeenCalledWith('/');
    // No stray refetch: wordActions is wired without onWordUpdated because
    // deleting navigates away first.
    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it('deletes a definition and refetches the word', async () => {
    const user = userEvent.setup();
    const searchSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord()]);
    const deleteDefinitionSpy = jest
      .spyOn(apiService, 'deleteDefinition')
      .mockResolvedValue(undefined);

    renderPage();
    await screen.findByRole('heading', { name: 'apple' });
    expect(searchSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Delete definition' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteDefinitionSpy).toHaveBeenCalledWith(10));
    // definitionActions is wired with onWordUpdated: fetchWord, since
    // deleting a definition keeps the page open.
    await waitFor(() => expect(searchSpy).toHaveBeenCalledTimes(2));
  });

  it('opens the add-definition modal and refetches after adding', async () => {
    const user = userEvent.setup();
    const searchSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord()]);

    renderPage();
    await screen.findByRole('heading', { name: 'apple' });

    await user.click(
      screen.getByRole('button', { name: 'Add new definition' }),
    );
    expect(screen.getByText('Definition Form Open: add')).toBeInTheDocument();
    expect(screen.getByText('Editing: none')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm Add' }));
    await waitFor(() => expect(searchSpy).toHaveBeenCalledTimes(2));
  });

  it('opens edit-definition modal with the clicked definition', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([buildWord()]);

    renderPage();
    await screen.findByRole('heading', { name: 'apple' });

    await user.click(screen.getByRole('button', { name: 'Edit definition' }));

    expect(screen.getByText('Definition Form Open: edit')).toBeInTheDocument();
    expect(screen.getByText('Editing: 10')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Close Definition Form' }),
    );
    expect(
      screen.queryByText('Definition Form Open: edit'),
    ).not.toBeInTheDocument();
  });

  it('shows the reminder banner and clears it on confirm', async () => {
    const user = userEvent.setup();
    const searchSpy = jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ reminder: 'Check plural form' })]);
    const updateSpy = jest
      .spyOn(apiService, 'updateWordFields')
      .mockResolvedValue(buildWord());

    renderPage();
    expect(await screen.findByText('Check plural form')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear reminder' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith(1, {
        word: 'apple',
        familiarity: FamiliarityLevel.YELLOW,
        reminder: '',
      }),
    );
    await waitFor(() => expect(searchSpy).toHaveBeenCalledTimes(2));
  });

  it('cancels the clear-reminder confirmation without clearing', async () => {
    const user = userEvent.setup();
    const updateSpy = jest.spyOn(apiService, 'updateWordFields');
    jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ reminder: 'Check plural form' })]);

    renderPage();
    await screen.findByText('Check plural form');

    await user.click(screen.getByRole('button', { name: 'Clear reminder' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.queryByRole('heading', { name: 'Clear Reminder' }),
    ).not.toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('shows a toast when clearing the reminder fails', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'searchWords')
      .mockResolvedValue([buildWord({ reminder: 'Check plural form' })]);
    jest
      .spyOn(apiService, 'updateWordFields')
      .mockRejectedValue(new Error('clear failed'));

    renderPage();
    await screen.findByText('Check plural form');

    await user.click(screen.getByRole('button', { name: 'Clear reminder' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(
      await screen.findByText('Failed to clear reminder: clear failed'),
    ).toBeInTheDocument();
  });
});

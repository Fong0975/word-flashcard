import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { MockInstance } from 'vitest';

import { apiService } from '../../../lib/api';
import { pressBrowserBack } from '../../../test-utils/unsavedChanges';

import { NoteCreatePage } from './NoteCreatePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <NoteCreatePage />
    </MemoryRouter>,
  );

describe('NoteCreatePage', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    mockNavigate.mockClear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // DetailPageLayout renders the real Header, whose useDarkMode hook reads
    // window.matchMedia; jsdom doesn't implement it, so stub it out.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('sets the document title', () => {
    renderPage();

    expect(document.title).toBe('New Note | Flashcard');
  });

  it('disables Save until a title is entered', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Note title'), 'My note');

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('creates the note and navigates to it on save', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(apiService, 'createNote').mockResolvedValue({
      id: 42,
      title: 'My note',
      content: 'Some content',
      sort_order: 0,
      updated_at: null,
    });

    renderPage();

    await user.type(screen.getByPlaceholderText('Note title'), 'My note');
    await user.type(
      screen.getByPlaceholderText('Write your note...'),
      'Some content',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(createSpy).toHaveBeenCalledWith({
      title: 'My note',
      content: 'Some content',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/note/42', { replace: true });
  });

  it('shows an error and re-enables Save when creation fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'createNote').mockRejectedValue(
      new Error('create failed'),
    );

    renderPage();

    await user.type(screen.getByPlaceholderText('Note title'), 'My note');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('create failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates back to the notes tab when Back is pressed with nothing entered', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes', {
      replace: true,
    });
  });

  it.each([
    {
      name: 'title has been entered and the user discards',
      placeholder: 'Note title',
      choice: 'Discard changes',
      expectNavigation: true,
    },
    {
      name: 'content has been entered and the user discards',
      placeholder: 'Write your note...',
      choice: 'Discard changes',
      expectNavigation: true,
    },
    {
      name: 'title has been entered and the user keeps editing',
      placeholder: 'Note title',
      choice: 'Keep editing',
      expectNavigation: false,
    },
    {
      name: 'content has been entered and the user keeps editing',
      placeholder: 'Write your note...',
      choice: 'Keep editing',
      expectNavigation: false,
    },
  ])(
    'confirms before leaving when Back is pressed and $name',
    async ({ placeholder, choice, expectNavigation }) => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByPlaceholderText(placeholder), 'Draft text');
      await user.click(screen.getByRole('button', { name: 'Go back' }));

      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: choice }));

      expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
      if (expectNavigation) {
        expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes', {
          replace: true,
        });
      } else {
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText(placeholder)).toHaveValue(
          'Draft text',
        );
      }
    },
  );

  it.each([
    { name: 'asks for confirmation when dirty', draft: 'Draft text' },
    { name: 'does not ask for confirmation when clean', draft: '' },
  ])('browser back $name', async ({ draft }) => {
    const user = userEvent.setup();
    renderPage();

    if (draft) {
      await user.type(screen.getByPlaceholderText('Note title'), draft);
    }
    pressBrowserBack();

    if (draft) {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    }
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

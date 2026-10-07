import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { MockInstance } from 'vitest';

import { Note } from '../../../types/api';
import { apiService } from '../../../lib/api';
import { pressBrowserBack } from '../../../test-utils/unsavedChanges';

import { NoteDetailPage } from './NoteDetailPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}));

const note: Note = {
  id: 1,
  title: 'My note',
  content: 'Some content',
  sort_order: 0,
  updated_at: '2026-07-10T10:00:00Z',
};

/**
 * Renders the page for the stored note and switches it into edit mode.
 *
 * @returns The user-event instance driving the page
 */
const renderInEditMode = async () => {
  const user = userEvent.setup();
  vi.spyOn(apiService, 'getNote').mockResolvedValue(note);

  render(
    <MemoryRouter>
      <NoteDetailPage />
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'My note' });
  await user.click(screen.getByRole('button', { name: 'Edit' }));

  return user;
};

describe('NoteDetailPage unsaved changes', () => {
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

  it('navigates back without confirming when editing but nothing was changed', async () => {
    const user = await renderInEditMode();

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes', {
      replace: true,
    });
  });

  it.each([
    {
      name: 'the title was changed and the user discards',
      placeholder: 'Note title',
      choice: 'Discard changes',
      expectNavigation: true,
    },
    {
      name: 'the content was changed and the user discards',
      placeholder: 'Write your note...',
      choice: 'Discard changes',
      expectNavigation: true,
    },
    {
      name: 'the title was changed and the user keeps editing',
      placeholder: 'Note title',
      choice: 'Keep editing',
      expectNavigation: false,
    },
    {
      name: 'the content was changed and the user keeps editing',
      placeholder: 'Write your note...',
      choice: 'Keep editing',
      expectNavigation: false,
    },
  ])(
    'confirms before leaving when Back is pressed and $name',
    async ({ placeholder, choice, expectNavigation }) => {
      const user = await renderInEditMode();

      const input = screen.getByPlaceholderText(placeholder);
      await user.clear(input);
      await user.type(input, 'Edited text');
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
          'Edited text',
        );
      }
    },
  );

  it.each([
    { name: 'asks for confirmation when dirty', edit: true },
    { name: 'does not ask for confirmation when clean', edit: false },
  ])('browser back while editing $name', async ({ edit }) => {
    const user = await renderInEditMode();

    if (edit) {
      await user.type(screen.getByPlaceholderText('Note title'), ' edited');
    }
    pressBrowserBack();

    if (edit) {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    }
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

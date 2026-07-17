import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { apiService } from '../../../lib/api';

import { NoteCreatePage } from './NoteCreatePage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <NoteCreatePage />
    </MemoryRouter>,
  );

describe('NoteCreatePage', () => {
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

  it('disables Save until a title is entered', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Note title'), 'My note');

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('creates the note and navigates to it on save', async () => {
    const user = userEvent.setup();
    const createSpy = jest.spyOn(apiService, 'createNote').mockResolvedValue({
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
    expect(mockNavigate).toHaveBeenCalledWith('/note/42');
  });

  it('shows an error and re-enables Save when creation fails', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'createNote')
      .mockRejectedValue(new Error('create failed'));

    renderPage();

    await user.type(screen.getByPlaceholderText('Note title'), 'My note');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('create failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates back to the notes tab when Back is pressed', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/?tab=notes');
  });
});

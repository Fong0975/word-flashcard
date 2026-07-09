import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Header } from './Header';

const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
};

describe('Header', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    jest.restoreAllMocks();
  });

  it('renders the app title linking to home', () => {
    mockMatchMedia(false);
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /Flashcard/ });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders a link to the GitHub repository', () => {
    mockMatchMedia(false);
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'View source on GitHub' }),
    ).toHaveAttribute('href', 'https://github.com/Fong0975/word-flashcard');
  });

  it('toggles the dark mode label when clicked', async () => {
    mockMatchMedia(false);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', {
      name: 'Switch to dark mode',
    });

    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument();
  });
});

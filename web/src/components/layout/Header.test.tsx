import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Header } from './Header';

const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
};

describe('Header', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
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

  it('renders the info entry point', () => {
    // Full coverage of the info panel's version/copyright/GitHub-link
    // content lives in InfoMenu.test.tsx; this just checks Header wires it in.
    mockMatchMedia(false);
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
  });

  it('renders the data management settings entry point', () => {
    // Full coverage of the dropdown's Import/Export behavior lives in
    // DataManagementMenu.test.tsx; this just checks Header wires it in.
    mockMatchMedia(false);
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('button', { name: 'Settings' }),
    ).toBeInTheDocument();
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

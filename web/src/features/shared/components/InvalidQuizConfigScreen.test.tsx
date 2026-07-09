import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { InvalidQuizConfigScreen } from './InvalidQuizConfigScreen';

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  jest.restoreAllMocks();
});

describe('InvalidQuizConfigScreen', () => {
  it('renders the invalid configuration message', () => {
    render(
      <MemoryRouter>
        <InvalidQuizConfigScreen onBackToHome={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Invalid quiz configuration')).toBeInTheDocument();
  });

  it('calls onBackToHome when the body button is clicked', async () => {
    const user = userEvent.setup();
    const onBackToHome = jest.fn();
    render(
      <MemoryRouter>
        <InvalidQuizConfigScreen onBackToHome={onBackToHome} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });

  it('calls onBackToHome when the layout back button is clicked', async () => {
    const user = userEvent.setup();
    const onBackToHome = jest.fn();
    render(
      <MemoryRouter>
        <InvalidQuizConfigScreen onBackToHome={onBackToHome} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });
});

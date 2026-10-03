import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { InvalidQuizConfigScreen } from './InvalidQuizConfigScreen';

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  vi.restoreAllMocks();
});

describe('InvalidQuizConfigScreen', () => {
  it('calls onBackToHome when the layout back button is clicked', async () => {
    const user = userEvent.setup();
    const onBackToHome = vi.fn();
    render(
      <MemoryRouter>
        <InvalidQuizConfigScreen onBackToHome={onBackToHome} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });
});

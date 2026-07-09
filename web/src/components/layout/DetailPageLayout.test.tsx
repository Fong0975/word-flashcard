import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { DetailPageLayout } from './DetailPageLayout';

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

describe('DetailPageLayout', () => {
  it('renders the body content', () => {
    render(
      <MemoryRouter>
        <DetailPageLayout onBack={jest.fn()} body={<p>Body content</p>} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = jest.fn();
    render(
      <MemoryRouter>
        <DetailPageLayout onBack={onBack} body={<p>Body content</p>} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders header content when provided', () => {
    render(
      <MemoryRouter>
        <DetailPageLayout
          onBack={jest.fn()}
          header={<h2>Word: apple</h2>}
          body={<p>Body content</p>}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Word: apple' }),
    ).toBeInTheDocument();
  });

  it('renders footer content when provided', () => {
    render(
      <MemoryRouter>
        <DetailPageLayout
          onBack={jest.fn()}
          body={<p>Body content</p>}
          footer={<p>Footer content</p>}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});

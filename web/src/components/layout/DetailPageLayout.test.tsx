import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { DetailPageLayout } from './DetailPageLayout';

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

describe('DetailPageLayout', () => {
  it('renders the body content', () => {
    render(
      <MemoryRouter>
        <DetailPageLayout onBack={vi.fn()} body={<p>Body content</p>} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
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
          onBack={vi.fn()}
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
          onBack={vi.fn()}
          body={<p>Body content</p>}
          footer={<p>Footer content</p>}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it.each([
    {
      name: 'keeps only the glass panel classes when omitted',
      cardClassName: undefined,
      expected:
        'glass-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg',
    },
    {
      name: 'appends the extra classes when provided',
      cardClassName: 'glass-glow glass-glow-green',
      expected:
        'glass-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg glass-glow glass-glow-green',
    },
  ])('cardClassName: $name', ({ cardClassName, expected }) => {
    render(
      <MemoryRouter>
        <DetailPageLayout
          onBack={vi.fn()}
          body={<p>Body content</p>}
          cardClassName={cardClassName}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('detail-page-card')).toHaveAttribute(
      'class',
      expected,
    );
  });
});

import { render, screen, waitFor } from '@testing-library/react';

import pkg from '../../../package.json';
import { ApiVersionProvider } from '../../contexts/ApiVersionContext';
import { apiService } from '../../lib/api';

import { InfoMenu } from './InfoMenu';

describe('InfoMenu', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the info button', () => {
    render(<InfoMenu />);

    expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
  });

  it('shows the web version and copyright notice with the current year', () => {
    const { container } = render(<InfoMenu />);
    const year = new Date().getFullYear().toString();

    expect(container.textContent).toContain(`Flashcard v${pkg.version}`);
    expect(container.textContent).toContain(year);
    expect(container.textContent).toContain('SWind');
  });

  it('shows an em dash for the API version when it is unavailable', () => {
    const { container } = render(<InfoMenu />);

    expect(container.textContent).toContain('(API v—)');
  });

  it('shows the fetched API version once available', async () => {
    vi.spyOn(apiService, 'getInformation').mockResolvedValue({
      version: '2.5.0',
    });

    const { container } = render(
      <ApiVersionProvider>
        <InfoMenu />
      </ApiVersionProvider>,
    );

    await waitFor(() =>
      expect(container.textContent).toContain('(API v2.5.0)'),
    );
  });

  it('renders a link to the GitHub repository', () => {
    render(<InfoMenu />);

    const link = screen.getByRole('menuitem', { name: /GitHub/ });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/Fong0975/word-flashcard',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

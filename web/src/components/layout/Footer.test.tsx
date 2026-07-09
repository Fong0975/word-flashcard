import { render, waitFor } from '@testing-library/react';

import pkg from '../../../package.json';
import { ApiVersionProvider } from '../../contexts/ApiVersionContext';
import { apiService } from '../../lib/api';

import { Footer } from './Footer';

describe('Footer', () => {
  afterEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('renders the copyright notice with the current year', () => {
    const { container } = render(<Footer />);
    const year = new Date().getFullYear().toString();

    expect(container.textContent).toContain(year);
    expect(container.textContent).toContain('SWind');
  });

  it('shows the web build version and an em dash for an unknown API version', () => {
    const { container } = render(<Footer />);

    expect(container.textContent).toContain(`Web: v${pkg.version}`);
    expect(container.textContent).toContain('API: v—');
  });

  it('shows the fetched API version once available', async () => {
    jest
      .spyOn(apiService, 'getInformation')
      .mockResolvedValue({ version: '2.5.0' });

    const { container } = render(
      <ApiVersionProvider>
        <Footer />
      </ApiVersionProvider>,
    );

    await waitFor(() => expect(container.textContent).toContain('API: v2.5.0'));
  });
});

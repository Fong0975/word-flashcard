import { render, screen } from '@testing-library/react';

import { ModalLoadingFallback } from './ModalLoadingFallback';

describe('ModalLoadingFallback', () => {
  it('renders a loading indicator', () => {
    render(<ModalLoadingFallback />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';

import { FormErrorMessage } from './FormErrorMessage';

describe('FormErrorMessage', () => {
  it('renders nothing when there is no error', () => {
    const { container } = render(<FormErrorMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the error text when present', () => {
    render(<FormErrorMessage error='Something went wrong' />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

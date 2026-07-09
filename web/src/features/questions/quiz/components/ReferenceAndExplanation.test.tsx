import { render, screen } from '@testing-library/react';

import { ReferenceAndExplanation } from './ReferenceAndExplanation';

describe('ReferenceAndExplanation', () => {
  it('renders nothing when both fields are empty', () => {
    const { container } = render(
      <ReferenceAndExplanation reference='' notes='' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the reference when present', () => {
    render(<ReferenceAndExplanation reference='Textbook p.12' notes='' />);
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Textbook p.12')).toBeInTheDocument();
  });

  it('renders the notes as markdown when present', () => {
    render(<ReferenceAndExplanation reference='' notes='**important**' />);
    expect(screen.getByText('Explanation')).toBeInTheDocument();
    const strong = screen.getByText('important');
    expect(strong.tagName).toBe('STRONG');
  });
});

import { render, screen } from '@testing-library/react';

import { MarkdownContent } from './MarkdownContent';

describe('MarkdownContent', () => {
  it('renders bold markdown as a strong element', () => {
    render(<MarkdownContent content='**bold text**' />);
    const strong = screen.getByText('bold text');
    expect(strong.tagName).toBe('STRONG');
  });

  it('renders a markdown link', () => {
    render(<MarkdownContent content='[Anthropic](https://anthropic.com)' />);
    const link = screen.getByRole('link', { name: 'Anthropic' });
    expect(link).toHaveAttribute('href', 'https://anthropic.com');
  });

  it('does not unescape literal newlines by default', () => {
    render(<MarkdownContent content='line1\\nline2' />);
    // Left as-is, the literal backslash-n sequence is just plain text with
    // no markdown meaning, so it survives untouched as one text run.
    expect(screen.getByText('line1\\nline2')).toBeInTheDocument();
  });

  it('unescapes literal newlines when requested', () => {
    render(<MarkdownContent content='line1\\nline2' unescapeLiteralNewlines />);
    // Once unescaped, the literal `\n` sequence is gone (replaced by a real
    // newline before rendering), but both lines still appear somewhere.
    expect(screen.queryByText('line1\\nline2')).not.toBeInTheDocument();
    expect(screen.getByText(/line1/)).toBeInTheDocument();
    expect(screen.getByText(/line2/)).toBeInTheDocument();
  });
});

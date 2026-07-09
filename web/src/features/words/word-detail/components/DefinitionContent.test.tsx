import { render, screen } from '@testing-library/react';

import { WordDefinition } from '../../../../types/api';

import { DefinitionContent } from './DefinitionContent';

const buildDefinition = (
  overrides: Partial<WordDefinition> = {},
): WordDefinition => ({
  id: 1,
  definition: 'a fruit',
  examples: [],
  notes: '',
  part_of_speech: 'noun',
  phonetics: {},
  ...overrides,
});

describe('DefinitionContent', () => {
  it('renders the definition text', () => {
    render(<DefinitionContent definition={buildDefinition()} />);
    expect(screen.getByText('a fruit')).toBeInTheDocument();
  });

  it('renders examples when present', () => {
    render(
      <DefinitionContent
        definition={buildDefinition({ examples: ['I ate an apple'] })}
      />,
    );
    expect(screen.getByText('Examples:')).toBeInTheDocument();
    expect(screen.getByText('I ate an apple')).toBeInTheDocument();
  });

  it('does not render an examples section when there are none', () => {
    render(<DefinitionContent definition={buildDefinition()} />);
    expect(screen.queryByText('Examples:')).not.toBeInTheDocument();
  });

  it('renders notes as unescaped markdown', () => {
    render(
      <DefinitionContent
        definition={buildDefinition({ notes: '**call back**' })}
      />,
    );
    expect(screen.getByText('Notes:')).toBeInTheDocument();
    const strong = screen.getByText('call back');
    expect(strong.tagName).toBe('STRONG');
  });

  it('does not render a notes section when absent', () => {
    render(<DefinitionContent definition={buildDefinition()} />);
    expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
  });
});

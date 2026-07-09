import { render, screen } from '@testing-library/react';

import { WordDefinition } from '../../../../types/api';

import { WordDefinitionsPanel } from './WordDefinitionsPanel';

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

describe('WordDefinitionsPanel', () => {
  it('renders nothing when there are no definitions', () => {
    const { container } = render(<WordDefinitionsPanel definitions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the definition count and text', () => {
    render(
      <WordDefinitionsPanel
        definitions={[buildDefinition(), buildDefinition({ id: 2 })]}
      />,
    );

    expect(screen.getByText('Definitions (2)')).toBeInTheDocument();
    expect(screen.getAllByText('a fruit')).toHaveLength(2);
  });

  it('renders comma-separated parts of speech as separate tags', () => {
    render(
      <WordDefinitionsPanel
        definitions={[buildDefinition({ part_of_speech: 'noun, verb' })]}
      />,
    );

    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();
  });

  it('renders examples when present', () => {
    render(
      <WordDefinitionsPanel
        definitions={[buildDefinition({ examples: ['I ate an apple'] })]}
      />,
    );

    expect(screen.getByText('Examples:')).toBeInTheDocument();
    expect(screen.getByText('I ate an apple')).toBeInTheDocument();
  });

  it('renders notes as unescaped markdown', () => {
    render(
      <WordDefinitionsPanel
        definitions={[buildDefinition({ notes: '**call back**' })]}
      />,
    );

    expect(screen.getByText('Notes:')).toBeInTheDocument();
    const strong = screen.getByText('call back');
    expect(strong.tagName).toBe('STRONG');
  });
});

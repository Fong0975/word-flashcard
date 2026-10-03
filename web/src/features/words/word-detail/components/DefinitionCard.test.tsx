import { render, screen } from '@testing-library/react';

import { WordDefinition } from '../../../../types/api';

import { DefinitionCard } from './DefinitionCard';

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

describe('DefinitionCard', () => {
  it('renders the part of speech tag and definition text', () => {
    render(
      <DefinitionCard
        definition={buildDefinition()}
        index={0}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('a fruit')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('a fruit')).toBeInTheDocument();
  });

  it('delegates edit clicks with the definition', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const definition = buildDefinition();
    render(
      <DefinitionCard
        definition={definition}
        index={0}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />,
    );

    await user.click(screen.getByTitle('Edit definition'));
    expect(onEdit).toHaveBeenCalledWith(definition);
  });
});

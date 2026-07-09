import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordDefinition } from '../../../../types/api';

import { DefinitionsList } from './DefinitionsList';

jest.mock('../../../shared/speech');

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

describe('DefinitionsList', () => {
  it('shows the empty state and a count of zero when there are no definitions', () => {
    render(
      <DefinitionsList
        definitions={[]}
        wordText='apple'
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onAddNew={jest.fn()}
      />,
    );

    expect(screen.getByText('Definitions (0)')).toBeInTheDocument();
    expect(
      screen.getByText('No definitions available for this word yet.'),
    ).toBeInTheDocument();
  });

  it('renders a card for every definition with the correct count', () => {
    render(
      <DefinitionsList
        definitions={[
          buildDefinition({ id: 1, definition: 'a fruit' }),
          buildDefinition({ id: 2, definition: 'to eat' }),
        ]}
        wordText='apple'
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onAddNew={jest.fn()}
      />,
    );

    expect(screen.getByText('Definitions (2)')).toBeInTheDocument();
    expect(screen.getByText('a fruit')).toBeInTheDocument();
    expect(screen.getByText('to eat')).toBeInTheDocument();
  });

  it('calls onAddNew when the add button is clicked', async () => {
    const user = userEvent.setup();
    const onAddNew = jest.fn();
    render(
      <DefinitionsList
        definitions={[]}
        wordText='apple'
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onAddNew={onAddNew}
      />,
    );

    await user.click(screen.getByTitle('Add new definition'));
    expect(onAddNew).toHaveBeenCalledTimes(1);
  });

  it('only offers the speech fallback on the first card when no definition has audio', () => {
    render(
      <DefinitionsList
        definitions={[buildDefinition({ id: 1 }), buildDefinition({ id: 2 })]}
        wordText='apple'
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onAddNew={jest.fn()}
      />,
    );

    expect(screen.getAllByTitle('British pronunciation')).toHaveLength(1);
    expect(screen.getAllByTitle('American pronunciation')).toHaveLength(1);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordDefinition } from '../../../../types/api';

import { DefinitionActions } from './DefinitionActions';

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

describe('DefinitionActions', () => {
  it('calls onEdit with the definition when the edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const definition = buildDefinition();
    render(
      <DefinitionActions
        definition={definition}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />,
    );

    await user.click(screen.getByTitle('Edit definition'));
    expect(onEdit).toHaveBeenCalledWith(definition);
  });

  it('opens a confirmation dialog before deleting', async () => {
    const user = userEvent.setup();
    render(
      <DefinitionActions
        definition={buildDefinition()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.queryByText('Delete Definition')).not.toBeInTheDocument();

    await user.click(screen.getByTitle('Delete definition'));
    expect(screen.getByText('Delete Definition')).toBeInTheDocument();
  });

  it('calls onDelete with the definition when confirmed', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const definition = buildDefinition();
    render(
      <DefinitionActions
        definition={definition}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByTitle('Delete definition'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith(definition);
    expect(screen.queryByText('Delete Definition')).not.toBeInTheDocument();
  });

  it('closes the dialog without deleting when cancelled', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <DefinitionActions
        definition={buildDefinition()}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByTitle('Delete definition'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete Definition')).not.toBeInTheDocument();
  });
});

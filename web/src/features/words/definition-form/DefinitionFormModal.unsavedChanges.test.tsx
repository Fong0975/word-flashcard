import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { WordDefinition } from '../../../types/api';
import { modalLeaveMethods } from '../../../test-utils/unsavedChanges';

import { DefinitionFormModal } from './DefinitionFormModal';

const definition: WordDefinition = {
  id: 1,
  definition: 'a fruit',
  examples: [],
  notes: '',
  part_of_speech: 'noun',
  phonetics: {},
};

describe('DefinitionFormModal unsaved changes', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('closes without confirming when the close button is clicked on an untouched form', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DefinitionFormModal
        isOpen
        onClose={onClose}
        wordId={null}
        wordText='apple'
        mode='edit'
        definition={definition}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Close modal' }));

    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DefinitionFormModal
        isOpen
        onClose={onClose}
        wordId={1}
        wordText='apple'
      />,
    );

    await user.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it.each(modalLeaveMethods)(
    'confirms before discarding unsaved changes when leaving via $via',
    async ({ leave }) => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <DefinitionFormModal
          isOpen
          onClose={onClose}
          wordId={1}
          wordText='apple'
        />,
      );
      await user.type(
        screen.getByPlaceholderText('Enter the definition...'),
        'a fruit',
      );

      await leave(user);
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Keep editing' }));

      expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(
        screen.getByPlaceholderText('Enter the definition...'),
      ).toHaveValue('a fruit');

      await leave(user);
      await user.click(screen.getByRole('button', { name: 'Discard changes' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );
});

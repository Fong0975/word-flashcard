import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordDefinition } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { DefinitionFormModal } from './DefinitionFormModal';
import { CambridgeApiResponse } from './types';

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

const buildDictionaryResponse = (
  overrides: Partial<CambridgeApiResponse> = {},
): CambridgeApiResponse => ({
  word: 'apple',
  pos: ['noun'],
  verbs: [],
  pronunciation: [],
  definition: [],
  ...overrides,
});

describe('DefinitionFormModal', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <DefinitionFormModal
        isOpen={false}
        onClose={jest.fn()}
        wordId={1}
        wordText='apple'
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the add-mode title with the word being defined', () => {
    render(
      <DefinitionFormModal
        isOpen
        onClose={jest.fn()}
        wordId={1}
        wordText='apple'
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Add New Definition' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'apple' })).toBeInTheDocument();
  });

  it('shows the edit-mode title with the definition pre-filled', () => {
    render(
      <DefinitionFormModal
        isOpen
        onClose={jest.fn()}
        wordId={null}
        wordText='apple'
        mode='edit'
        definition={buildDefinition()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Edit Definition' }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('a fruit')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Update Definition' }),
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <DefinitionFormModal
        isOpen
        onClose={onClose}
        wordId={1}
        wordText='apple'
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('adds a new definition once the required fields are filled', async () => {
    const user = userEvent.setup();
    const addDefinitionSpy = jest
      .spyOn(apiService, 'addDefinition')
      .mockResolvedValue(buildDefinition());
    const onClose = jest.fn();
    const onDefinitionAdded = jest.fn();
    render(
      <DefinitionFormModal
        isOpen
        onClose={onClose}
        onDefinitionAdded={onDefinitionAdded}
        wordId={42}
        wordText='apple'
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: /noun/i }));
    await user.type(
      screen.getByPlaceholderText('Enter the definition...'),
      'a fruit',
    );
    await user.click(screen.getByRole('button', { name: 'Add Definition' }));

    await waitFor(() =>
      expect(addDefinitionSpy).toHaveBeenCalledWith(42, expect.any(Object)),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDefinitionAdded).toHaveBeenCalledTimes(1);
  });

  it('fetches dictionary data and applies a definition to the form', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'lookupWord').mockResolvedValue(
      buildDictionaryResponse({
        definition: [
          {
            id: 1,
            pos: 'noun',
            text: 'a round fruit',
            translation: '蘋果',
            example: [],
          },
        ],
      }),
    );
    render(
      <DefinitionFormModal
        isOpen
        onClose={jest.fn()}
        wordId={1}
        wordText='apple'
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Fetch Definition' }));
    await screen.findByText('a round fruit');

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByPlaceholderText('Enter the definition...')).toHaveValue(
      '蘋果 a round fruit',
    );
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WordDefinition } from '../../../types/api';
import { apiService } from '../../../lib/api';

import { DefinitionFormModal } from './DefinitionFormModal';
import { ExternalDictionaryState } from './hooks/useDictionaryData';
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

const buildExternalDictionaryState = (): ExternalDictionaryState => ({
  dictionaryData: null,
  isLoadingDictionary: false,
  dictionaryError: null,
  isCollapsed: false,
  setDictionaryData: jest.fn(),
  setIsLoadingDictionary: jest.fn(),
  setDictionaryError: jest.fn(),
  setIsCollapsed: jest.fn(),
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

  it('fetches dictionary data and applies a definition', async () => {
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

  it('applies fetched pronunciation data to the form', async () => {
    const user = userEvent.setup();
    jest.spyOn(apiService, 'lookupWord').mockResolvedValue(
      buildDictionaryResponse({
        pronunciation: [
          {
            pos: 'noun',
            lang: 'uk',
            url: 'https://example.com/uk.mp3',
            pron: '/ˈæp.əl/',
          },
          {
            pos: 'noun',
            lang: 'us',
            url: 'https://example.com/us.mp3',
            pron: '/ˈæp.əl/',
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
    await screen.findByText('Pronunciation');

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      screen.getByPlaceholderText('https://example.com/audio-uk.mp3'),
    ).toHaveValue('https://example.com/uk.mp3');
    expect(
      screen.getByPlaceholderText('https://example.com/audio-us.mp3'),
    ).toHaveValue('https://example.com/us.mp3');
  });

  it.each([
    { shouldResetDictionaryOnClose: true, resetsFully: true },
    { shouldResetDictionaryOnClose: false, resetsFully: false },
  ])(
    'resets dictionary state on close (reset=$shouldResetDictionaryOnClose)',
    ({ shouldResetDictionaryOnClose, resetsFully }) => {
      const externalDictionaryState = buildExternalDictionaryState();
      const { rerender } = render(
        <DefinitionFormModal
          isOpen
          onClose={jest.fn()}
          wordId={1}
          wordText='apple'
          shouldResetDictionaryOnClose={shouldResetDictionaryOnClose}
          externalDictionaryState={externalDictionaryState}
        />,
      );

      rerender(
        <DefinitionFormModal
          isOpen={false}
          onClose={jest.fn()}
          wordId={1}
          wordText='apple'
          shouldResetDictionaryOnClose={shouldResetDictionaryOnClose}
          externalDictionaryState={externalDictionaryState}
        />,
      );

      expect(externalDictionaryState.setIsCollapsed).toHaveBeenCalledWith(true);
      // Ternary-computed expected call lists keep both branches under a
      // single unconditional `expect`, since `jest/no-conditional-expect`
      // disallows wrapping `expect` itself in an if/else.
      expect(externalDictionaryState.setDictionaryData.mock.calls).toEqual(
        resetsFully ? [[null]] : [],
      );
      expect(externalDictionaryState.setDictionaryError.mock.calls).toEqual(
        resetsFully ? [[null]] : [],
      );
    },
  );

  describe('copy word button', () => {
    afterEach(() => {
      delete (navigator as unknown as { clipboard?: unknown }).clipboard;
    });

    it('swaps the copy icon to a checkmark on success', async () => {
      const user = userEvent.setup();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      });
      render(
        <DefinitionFormModal
          isOpen
          onClose={jest.fn()}
          wordId={1}
          wordText='apple'
        />,
      );

      const copyButton = screen.getByTitle('Copy word text to clipboard');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('apple');
      await waitFor(() =>
        expect(copyButton.innerHTML).toContain('text-green-500'),
      );
    });

    it('shows an error toast when copying the word fails', async () => {
      const user = userEvent.setup();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockRejectedValue(new Error('Copy denied')),
        },
        configurable: true,
      });
      render(
        <DefinitionFormModal
          isOpen
          onClose={jest.fn()}
          wordId={1}
          wordText='apple'
        />,
      );

      await user.click(screen.getByTitle('Copy word text to clipboard'));

      expect(await screen.findByRole('alert')).toHaveTextContent('Copy denied');
    });
  });

  it('shows the edit-mode submitting text while updating', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(apiService, 'updateDefinition')
      .mockReturnValue(new Promise(() => {}));
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

    await user.click(screen.getByRole('button', { name: 'Update Definition' }));

    expect(
      await screen.findByText('Updating Definition...'),
    ).toBeInTheDocument();
  });
});

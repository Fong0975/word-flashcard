import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Word } from '../../../types/api';
import { FamiliarityLevel } from '../../../types/base';
import { apiService } from '../../../lib/api';

import { WordFormModal } from './WordFormModal';

const buildWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  word: 'apple',
  familiarity: FamiliarityLevel.RED,
  reminder: null,
  count_practise: 0,
  definitions: [],
  ...overrides,
});

describe('WordFormModal', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(apiService, 'searchWords').mockResolvedValue([]);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <WordFormModal isOpen={false} onClose={jest.fn()} mode='create' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the create-mode title without the familiarity or reminder sections', () => {
    render(<WordFormModal isOpen onClose={jest.fn()} mode='create' />);

    expect(
      screen.getByRole('heading', { name: 'Add New Word' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Word' })).toHaveValue('');
    expect(screen.queryByText('Familiarity Level')).not.toBeInTheDocument();
    expect(screen.queryByText('Reminder')).not.toBeInTheDocument();
  });

  it('shows the edit-mode title with the word pre-filled and the familiarity/reminder sections', () => {
    render(
      <WordFormModal
        isOpen
        onClose={jest.fn()}
        mode='edit'
        word={buildWord({ reminder: 'call back' })}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Edit Word' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Word' })).toHaveValue('apple');
    expect(screen.getByText('Familiarity Level')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByDisplayValue('call back')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<WordFormModal isOpen onClose={onClose} mode='create' />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('creates a new word and notifies the parent', async () => {
    const user = userEvent.setup();
    const createWordSpy = jest
      .spyOn(apiService, 'createWord')
      .mockResolvedValue(buildWord());
    const onClose = jest.fn();
    const onWordSaved = jest.fn();
    render(
      <WordFormModal
        isOpen
        onClose={onClose}
        onWordSaved={onWordSaved}
        mode='create'
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Word' }), 'banana');
    await user.click(screen.getByRole('button', { name: 'Add Word' }));

    await waitFor(() =>
      expect(createWordSpy).toHaveBeenCalledWith({ word: 'banana' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onWordSaved).toHaveBeenCalledWith('banana');
  });

  it('blocks submission and shows an error when the word already exists', async () => {
    const user = userEvent.setup();
    (apiService.searchWords as jest.Mock).mockResolvedValue([
      buildWord({ word: 'banana' }),
    ]);
    const createWordSpy = jest.spyOn(apiService, 'createWord');
    render(<WordFormModal isOpen onClose={jest.fn()} mode='create' />);

    await user.type(screen.getByRole('textbox', { name: 'Word' }), 'banana');
    await user.click(screen.getByRole('button', { name: 'Add Word' }));

    expect(
      await screen.findByText('Word "banana" already exists'),
    ).toBeInTheDocument();
    expect(createWordSpy).not.toHaveBeenCalled();
  });

  it('navigates to word detail and closes the modal when a suggestion is clicked', async () => {
    const user = userEvent.setup();
    const suggestedWord = buildWord({ id: 2, word: 'apple' });
    (apiService.searchWords as jest.Mock).mockResolvedValue([suggestedWord]);
    const onClose = jest.fn();
    const onOpenWordDetail = jest.fn();
    render(
      <WordFormModal
        isOpen
        onClose={onClose}
        onOpenWordDetail={onOpenWordDetail}
        mode='create'
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Word' }), 'app');

    const suggestionButton = await screen.findByRole('button', {
      name: 'apple',
    });
    await user.click(suggestionButton);

    expect(onOpenWordDetail).toHaveBeenCalledWith(suggestedWord);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles the reminder checkbox', async () => {
    const user = userEvent.setup();
    render(
      <WordFormModal
        isOpen
        onClose={jest.fn()}
        mode='edit'
        word={buildWord()}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    const textInput = screen.getByPlaceholderText('Enter reminder note...');

    expect(checkbox).not.toBeChecked();
    expect(textInput).toBeDisabled();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(textInput).toBeEnabled();
  });

  it('updates the reminder text input', async () => {
    const user = userEvent.setup();
    render(
      <WordFormModal
        isOpen
        onClose={jest.fn()}
        mode='edit'
        word={buildWord({ reminder: 'call back' })}
      />,
    );

    const textInput = screen.getByDisplayValue('call back');
    await user.clear(textInput);
    await user.type(textInput, 'renewed reminder');

    expect(screen.getByDisplayValue('renewed reminder')).toBeInTheDocument();
  });
});

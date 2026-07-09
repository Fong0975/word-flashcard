import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DefinitionForm } from '../types';

import { FormFields } from './FormFields';

const buildFormData = (
  overrides: Partial<DefinitionForm> = {},
): DefinitionForm => ({
  part_of_speech: [],
  definition: '',
  examples: [''],
  notes: '',
  phonetics: {},
  ...overrides,
});

const buildHandlers = () => ({
  handlePartOfSpeechChange: jest.fn(),
  handleDefinitionChange: jest.fn(),
  handleNotesChange: jest.fn(),
  appendToNotes: jest.fn(),
  handleExamplesChange: jest.fn(),
  addExampleInput: jest.fn(),
  removeExampleInput: jest.fn(),
  handlePhoneticsChange: jest.fn(),
});

describe('FormFields', () => {
  it('reflects the selected parts of speech', () => {
    render(
      <FormFields
        formData={buildFormData({ part_of_speech: ['noun'] })}
        isFormValid={false}
        partOfSpeechOptions={['noun', 'verb']}
        noteButtonsConfig={[]}
        handlers={buildHandlers()}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('calls handlePartOfSpeechChange when a checkbox is toggled', async () => {
    const user = userEvent.setup();
    const handlers = buildHandlers();
    render(
      <FormFields
        formData={buildFormData()}
        isFormValid={false}
        partOfSpeechOptions={['noun', 'verb']}
        noteButtonsConfig={[]}
        handlers={handlers}
      />,
    );

    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(handlers.handlePartOfSpeechChange).toHaveBeenCalledWith(
      'noun',
      true,
    );
  });

  it('warns when no part of speech is selected', () => {
    render(
      <FormFields
        formData={buildFormData({ part_of_speech: [] })}
        isFormValid={false}
        partOfSpeechOptions={['noun']}
        noteButtonsConfig={[]}
        handlers={buildHandlers()}
      />,
    );

    expect(
      screen.getByText('Please select at least one part of speech'),
    ).toBeInTheDocument();
  });

  it('warns when the definition is blank', () => {
    render(
      <FormFields
        formData={buildFormData({ definition: '' })}
        isFormValid={false}
        partOfSpeechOptions={[]}
        noteButtonsConfig={[]}
        handlers={buildHandlers()}
      />,
    );

    expect(screen.getByText('Definition is required')).toBeInTheDocument();
  });

  it('calls handleDefinitionChange as the user types', async () => {
    const user = userEvent.setup();
    const handlers = buildHandlers();
    render(
      <FormFields
        formData={buildFormData()}
        isFormValid={false}
        partOfSpeechOptions={[]}
        noteButtonsConfig={[]}
        handlers={handlers}
      />,
    );

    await user.type(
      screen.getByPlaceholderText('Enter the definition...'),
      'a',
    );
    expect(handlers.handleDefinitionChange).toHaveBeenCalledWith('a');
  });

  it('does not show a remove button for the only example', () => {
    render(
      <FormFields
        formData={buildFormData({ examples: [''] })}
        isFormValid={false}
        partOfSpeechOptions={[]}
        noteButtonsConfig={[]}
        handlers={buildHandlers()}
      />,
    );

    expect(screen.getByPlaceholderText('Example 1...')).toBeInTheDocument();
  });

  it('shows remove buttons once there is more than one example', async () => {
    const user = userEvent.setup();
    const handlers = buildHandlers();
    render(
      <FormFields
        formData={buildFormData({ examples: ['ex1', 'ex2'] })}
        isFormValid={false}
        partOfSpeechOptions={[]}
        noteButtonsConfig={[]}
        handlers={handlers}
      />,
    );

    const removeButtons = screen.getAllByRole('button', { name: '' });
    await user.click(removeButtons[0]);
    expect(handlers.removeExampleInput).toHaveBeenCalledWith(0);
  });

  it('calls addExampleInput when "Add Another Example" is clicked', async () => {
    const user = userEvent.setup();
    const handlers = buildHandlers();
    render(
      <FormFields
        formData={buildFormData()}
        isFormValid={false}
        partOfSpeechOptions={[]}
        noteButtonsConfig={[]}
        handlers={handlers}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Add Another Example' }),
    );
    expect(handlers.addExampleInput).toHaveBeenCalledTimes(1);
  });

  it('calls handlePhoneticsChange for the UK and US inputs', async () => {
    const user = userEvent.setup();
    const handlers = buildHandlers();
    render(
      <FormFields
        formData={buildFormData()}
        isFormValid={false}
        partOfSpeechOptions={[]}
        noteButtonsConfig={[]}
        handlers={handlers}
      />,
    );

    await user.type(
      screen.getByPlaceholderText('https://example.com/audio-uk.mp3'),
      'a',
    );
    expect(handlers.handlePhoneticsChange).toHaveBeenCalledWith('uk', 'a');

    await user.type(
      screen.getByPlaceholderText('https://example.com/audio-us.mp3'),
      'b',
    );
    expect(handlers.handlePhoneticsChange).toHaveBeenCalledWith('us', 'b');
  });
});

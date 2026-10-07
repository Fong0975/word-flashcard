import { renderHook, act } from '@testing-library/react';

import { WordDefinition } from '../../../../types/api';

import { useDefinitionForm } from './useDefinitionForm';

const definition: WordDefinition = {
  id: 1,
  definition: 'a fruit',
  examples: ['I ate an apple'],
  notes: 'line1\\nline2',
  part_of_speech: 'noun,verb',
  phonetics: { uk: 'uk.mp3' },
};

describe('useDefinitionForm isDirty', () => {
  it.each<{
    name: string;
    mode: 'add' | 'edit';
    edit: (form: ReturnType<typeof useDefinitionForm>) => void;
    expected: boolean;
  }>([
    {
      name: 'clean for an untouched add form',
      mode: 'add',
      edit: () => {},
      expected: false,
    },
    {
      name: 'dirty once a definition is typed in add mode',
      mode: 'add',
      edit: form => form.handlers.handleDefinitionChange('a fruit'),
      expected: true,
    },
    {
      name: 'dirty when dictionary data is applied in add mode',
      mode: 'add',
      edit: form => form.updateFormData({ phonetics: { uk: 'uk.mp3' } }),
      expected: true,
    },
    {
      name: 'clean when only a blank example row is added',
      mode: 'add',
      edit: form => form.handlers.addExampleInput(),
      expected: false,
    },
    {
      name: 'clean when a phonetic is typed and then cleared',
      mode: 'add',
      edit: form => {
        form.handlers.handlePhoneticsChange('us', 'us.mp3');
        form.handlers.handlePhoneticsChange('us', '');
      },
      expected: false,
    },
    {
      name: 'clean for an untouched edit form',
      mode: 'edit',
      edit: () => {},
      expected: false,
    },
    {
      name: 'dirty when the definition text is changed',
      mode: 'edit',
      edit: form => form.handlers.handleDefinitionChange('a red fruit'),
      expected: true,
    },
    {
      name: 'dirty when the notes are changed',
      mode: 'edit',
      edit: form => form.handlers.handleNotesChange('other notes'),
      expected: true,
    },
    {
      name: 'dirty when an example is changed',
      mode: 'edit',
      edit: form => form.handlers.handleExamplesChange(0, 'I ate a pear'),
      expected: true,
    },
    {
      name: 'dirty when a part of speech is unticked',
      mode: 'edit',
      edit: form => form.handlers.handlePartOfSpeechChange('verb', false),
      expected: true,
    },
    {
      name: 'clean when a part of speech is unticked and ticked again',
      mode: 'edit',
      edit: form => {
        form.handlers.handlePartOfSpeechChange('noun', false);
        form.handlers.handlePartOfSpeechChange('noun', true);
      },
      expected: false,
    },
  ])('is $name', ({ mode, edit, expected }) => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode,
        wordId: 1,
        definition: mode === 'edit' ? definition : undefined,
        onClose: vi.fn(),
      }),
    );

    act(() => {
      edit(result.current);
    });

    expect(result.current.isDirty).toBe(expected);
  });
});

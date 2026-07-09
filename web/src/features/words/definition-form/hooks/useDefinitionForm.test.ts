import { renderHook, act } from '@testing-library/react';

import { WordDefinition } from '../../../../types/api';
import { apiService } from '../../../../lib/api';

import { useDefinitionForm } from './useDefinitionForm';

const blankForm = {
  part_of_speech: [],
  definition: '',
  examples: [''],
  notes: '',
  phonetics: {},
};

const buildDefinition = (
  overrides: Partial<WordDefinition> = {},
): WordDefinition => ({
  id: 1,
  definition: 'a fruit',
  examples: ['I ate an apple'],
  notes: 'line1\\nline2',
  part_of_speech: 'noun,verb',
  phonetics: { uk: 'uk.mp3' },
  ...overrides,
});

describe('useDefinitionForm', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('is blank while closed', () => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: false,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );
    expect(result.current.formData).toEqual(blankForm);
  });

  it('is blank in add mode', () => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );
    expect(result.current.formData).toEqual(blankForm);
  });

  it('populates the form from the definition in edit mode', () => {
    const definition = buildDefinition();
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'edit',
        wordId: null,
        definition,
        onClose: jest.fn(),
      }),
    );

    expect(result.current.formData).toEqual({
      part_of_speech: ['noun', 'verb'],
      definition: 'a fruit',
      examples: ['I ate an apple'],
      notes: 'line1\nline2',
      phonetics: { uk: 'uk.mp3' },
    });
  });

  it('toggles a part of speech on and off', () => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );

    act(() => {
      result.current.handlers.handlePartOfSpeechChange('noun', true);
    });
    expect(result.current.formData.part_of_speech).toEqual(['noun']);

    act(() => {
      result.current.handlers.handlePartOfSpeechChange('noun', false);
    });
    expect(result.current.formData.part_of_speech).toEqual([]);
  });

  it('adds, edits, and removes example inputs', () => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );

    act(() => {
      result.current.handlers.handleExamplesChange(0, 'first example');
    });
    expect(result.current.formData.examples).toEqual(['first example']);

    act(() => {
      result.current.handlers.addExampleInput();
    });
    expect(result.current.formData.examples).toEqual(['first example', '']);

    act(() => {
      result.current.handlers.removeExampleInput(1);
    });
    expect(result.current.formData.examples).toEqual(['first example']);

    act(() => {
      result.current.handlers.removeExampleInput(0);
    });
    expect(result.current.formData.examples).toEqual(['first example']);
  });

  it('appends template text to notes with a newline separator', () => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );

    act(() => {
      result.current.handlers.handleNotesChange('Line 1');
      result.current.handlers.appendToNotes('Line 2');
    });

    expect(result.current.formData.notes).toBe('Line 1\nLine 2');
  });

  it('does not submit without a definition or a part of speech', async () => {
    const createSpy = jest.spyOn(apiService, 'addDefinition');
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('builds the payload and adds the definition', async () => {
    const addDefinitionSpy = jest
      .spyOn(apiService, 'addDefinition')
      .mockResolvedValue(buildDefinition());
    const onClose = jest.fn();
    const onDefinitionAdded = jest.fn();
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 42,
        onClose,
        onDefinitionAdded,
      }),
    );

    // Each handler is invoked in its own `act` so the hook re-renders in
    // between, matching real usage (separate user interactions) — some
    // handlers (e.g. handleExamplesChange) read `formData` from the render
    // closure rather than a functional updater, so batching multiple calls
    // together would make later calls stomp on earlier ones with stale data.
    act(() => {
      result.current.handlers.handlePartOfSpeechChange('adjective', true);
    });
    act(() => {
      result.current.handlers.handlePartOfSpeechChange('noun', true);
    });
    act(() => {
      result.current.handlers.handleDefinitionChange('a fruit');
    });
    act(() => {
      result.current.handlers.handleExamplesChange(0, 'ex1');
    });
    act(() => {
      result.current.handlers.addExampleInput();
    });
    act(() => {
      result.current.handlers.handleExamplesChange(1, '   ');
    });
    act(() => {
      result.current.handlers.handlePhoneticsChange('uk', ' uk.mp3 ');
    });
    act(() => {
      result.current.handlers.handlePhoneticsChange('us', '');
    });
    act(() => {
      result.current.handlers.handleNotesChange('line1\nline2');
    });

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(addDefinitionSpy).toHaveBeenCalledWith(42, {
      definition: 'a fruit',
      part_of_speech: 'noun,adjective',
      examples: ['ex1'],
      phonetics: { uk: 'uk.mp3' },
      notes: 'line1\\nline2',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDefinitionAdded).toHaveBeenCalledTimes(1);
  });

  it('updates the definition in edit mode', async () => {
    const definition = buildDefinition({ id: 7 });
    const updateDefinitionSpy = jest
      .spyOn(apiService, 'updateDefinition')
      .mockResolvedValue(definition);
    const onDefinitionUpdated = jest.fn();
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'edit',
        wordId: null,
        definition,
        onClose: jest.fn(),
        onDefinitionUpdated,
      }),
    );

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(updateDefinitionSpy).toHaveBeenCalledWith(7, expect.any(Object));
    expect(onDefinitionUpdated).toHaveBeenCalledTimes(1);
  });

  it('reports a formatted error message when submission fails', async () => {
    jest
      .spyOn(apiService, 'addDefinition')
      .mockRejectedValue(new Error('network down'));
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
        onError,
      }),
    );

    act(() => {
      result.current.handlers.handlePartOfSpeechChange('noun', true);
      result.current.handlers.handleDefinitionChange('a fruit');
    });

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(onError).toHaveBeenCalledWith(
      'Failed to add definition: network down',
    );
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updateFormData merges partial updates', () => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );

    act(() => {
      result.current.updateFormData({ definition: 'merged in' });
    });

    expect(result.current.formData.definition).toBe('merged in');
    expect(result.current.formData.examples).toEqual(['']);
  });

  it('reports isFormValid based on definition and part of speech', () => {
    const { result } = renderHook(() =>
      useDefinitionForm({
        isOpen: true,
        mode: 'add',
        wordId: 1,
        onClose: jest.fn(),
      }),
    );
    expect(result.current.isFormValid).toBe(false);

    act(() => {
      result.current.handlers.handleDefinitionChange('a fruit');
      result.current.handlers.handlePartOfSpeechChange('noun', true);
    });
    expect(result.current.isFormValid).toBe(true);
  });
});

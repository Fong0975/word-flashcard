import { renderHook, act } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { WordDefinition } from '../../../../types/api';
import { apiService } from '../../../../lib/api';
import { DefinitionActionsCallbacks } from '../types/word-detail';

import { useDefinitionActions } from './useDefinitionActions';

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

describe('useDefinitionActions', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('handleNew does not throw', () => {
    const callbacks: DefinitionActionsCallbacks = {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    const { result } = renderHook(() => useDefinitionActions({ callbacks }));

    expect(() => result.current.handleNew()).not.toThrow();
  });

  it('delegates edit requests to the onEdit callback', () => {
    const onEdit = vi.fn();
    const callbacks: DefinitionActionsCallbacks = {
      onEdit,
      onDelete: vi.fn(),
    };
    const { result } = renderHook(() => useDefinitionActions({ callbacks }));
    const definition = buildDefinition();

    act(() => {
      result.current.handleEditDefinition(definition);
    });

    expect(onEdit).toHaveBeenCalledWith(definition);
  });

  it('deletes the definition and notifies onWordUpdated', async () => {
    const deleteDefinitionSpy = vi
      .spyOn(apiService, 'deleteDefinition')
      .mockResolvedValue(undefined);
    const onWordUpdated = vi.fn();
    const callbacks: DefinitionActionsCallbacks = {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onWordUpdated,
    };
    const { result } = renderHook(() => useDefinitionActions({ callbacks }));

    await act(async () => {
      await result.current.handleDeleteDefinition(buildDefinition({ id: 5 }));
    });

    expect(deleteDefinitionSpy).toHaveBeenCalledWith(5);
    expect(onWordUpdated).toHaveBeenCalledTimes(1);
  });

  it('reports a formatted error message when deletion fails', async () => {
    vi.spyOn(apiService, 'deleteDefinition').mockRejectedValue(
      new Error('network down'),
    );
    const onError = vi.fn();
    const callbacks: DefinitionActionsCallbacks = {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    const { result } = renderHook(() =>
      useDefinitionActions({ callbacks, onError }),
    );

    await act(async () => {
      await result.current.handleDeleteDefinition(buildDefinition());
    });

    expect(onError).toHaveBeenCalledWith(
      'Failed to delete definition: network down',
    );
  });
});

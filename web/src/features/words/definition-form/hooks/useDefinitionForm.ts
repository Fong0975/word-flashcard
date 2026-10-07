import { useState, useEffect } from 'react';

import { apiService } from '../../../../lib/api';
import { getApiErrorMessage } from '../../../../lib/apiErrorMessage';
import { WordDefinition } from '../../../../types/api';
import { appendTemplateText } from '../../../../utils/textTemplates';
import { DefinitionForm } from '../types';
import {
  PART_OF_SPEECH_OPTIONS,
  normalizePartsOfSpeech,
} from '../utils/partOfSpeech';

// Mutable version of the request types for building payload
type MutableDefinitionRequest = {
  definition: string;
  examples: string[];
  notes: string;
  part_of_speech?: string;
  phonetics: Record<string, unknown>;
};

interface UseDefinitionFormProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  wordId: number | null;
  definition?: WordDefinition | null;
  onDefinitionAdded?: () => void;
  onDefinitionUpdated?: () => void;
  onClose: () => void;
  onError?: (message: string) => void;
}

const createEmptyFormData = (): DefinitionForm => ({
  part_of_speech: [],
  definition: '',
  examples: [''],
  notes: '',
  phonetics: {},
});

/**
 * Returns the form data the form starts from: the definition being edited,
 * or a blank form when adding (or when edit mode has no definition yet).
 *
 * @param mode - Whether the form adds a new definition or edits an existing one
 * @param definition - The definition being edited, if any
 * @returns The starting form data
 */
const getInitialFormData = (
  mode: 'add' | 'edit',
  definition?: WordDefinition | null,
): DefinitionForm =>
  mode === 'edit' && definition
    ? {
        part_of_speech: definition.part_of_speech
          ? normalizePartsOfSpeech(definition.part_of_speech.split(','))
          : [],
        definition: definition.definition || '',
        examples:
          definition.examples && definition.examples.length > 0
            ? [...definition.examples]
            : [''],
        notes: definition.notes ? definition.notes.replace(/\\n/g, '\n') : '',
        phonetics: definition.phonetics || {},
      }
    : createEmptyFormData();

/**
 * Reduces form data to the parts that matter for change detection, ignoring
 * differences that do not survive submission: part-of-speech tick order,
 * blank example rows, and unset vs. empty phonetics.
 *
 * @param form - The form data to reduce
 * @returns A string that is equal for two forms with the same content
 */
const toComparableContent = (form: DefinitionForm): string =>
  JSON.stringify({
    part_of_speech: [...form.part_of_speech].sort(),
    definition: form.definition,
    examples: form.examples.filter(example => example.trim()),
    notes: form.notes,
    uk: form.phonetics.uk ?? '',
    us: form.phonetics.us ?? '',
  });

export const useDefinitionForm = ({
  isOpen,
  mode,
  wordId,
  definition,
  onDefinitionAdded,
  onDefinitionUpdated,
  onClose,
  onError,
}: UseDefinitionFormProps) => {
  // Form state
  const [formData, setFormData] = useState<DefinitionForm>(createEmptyFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or populate form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(createEmptyFormData());
    } else if ((mode === 'edit' && definition) || mode === 'add') {
      setFormData(getInitialFormData(mode, definition));
    }
  }, [isOpen, mode, definition]);

  // Form handlers
  const handlePartOfSpeechChange = (pos: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      part_of_speech: checked
        ? [...prev.part_of_speech, pos]
        : prev.part_of_speech.filter(p => p !== pos),
    }));
  };

  const handleDefinitionChange = (definition: string) => {
    setFormData(prev => ({ ...prev, definition }));
  };

  const handleNotesChange = (notes: string) => {
    setFormData(prev => ({ ...prev, notes }));
  };

  const appendToNotes = (textToAppend: string) => {
    setFormData(prev => ({
      ...prev,
      notes: appendTemplateText(prev.notes, textToAppend),
    }));
  };

  const handleExamplesChange = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData(prev => ({ ...prev, examples: newExamples }));
  };

  const addExampleInput = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, ''],
    }));
  };

  const removeExampleInput = (index: number) => {
    if (formData.examples.length > 1) {
      const newExamples = formData.examples.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, examples: newExamples }));
    }
  };

  const handlePhoneticsChange = (type: 'uk' | 'us', value: string) => {
    setFormData(prev => ({
      ...prev,
      phonetics: {
        ...prev.phonetics,
        [type]: value,
      },
    }));
  };

  // Update form data from external source (e.g., dictionary data)
  const updateFormData = (updates: Partial<DefinitionForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Form submission
  const handleSubmit = async () => {
    if (!formData.definition.trim() || formData.part_of_speech.length === 0) {
      return;
    }

    if (mode === 'edit' && !definition?.id) {
      return;
    }

    if (mode === 'add' && !wordId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: MutableDefinitionRequest = {
        definition: formData.definition.trim(),
        examples: [],
        notes: '',
        phonetics: {},
      };

      // Sort part of speech by UI order before joining
      if (formData.part_of_speech.length > 0) {
        const sortedPartOfSpeech = formData.part_of_speech
          .slice()
          .sort((a, b) => {
            const indexA = PART_OF_SPEECH_OPTIONS.indexOf(a);
            const indexB = PART_OF_SPEECH_OPTIONS.indexOf(b);
            return indexA - indexB;
          });
        payload.part_of_speech = sortedPartOfSpeech.join(',');
      }

      const nonEmptyExamples = formData.examples.filter(ex => ex.trim());
      payload.examples = nonEmptyExamples;

      const phoneticsPayload: Record<string, unknown> = {};
      if (formData.phonetics.uk?.trim()) {
        phoneticsPayload.uk = formData.phonetics.uk.trim();
      }
      if (formData.phonetics.us?.trim()) {
        phoneticsPayload.us = formData.phonetics.us.trim();
      }
      payload.phonetics = phoneticsPayload;

      payload.notes = formData.notes.trim()
        ? formData.notes.trim().replace(/\n/g, '\\n')
        : '';

      if (mode === 'edit' && definition?.id) {
        await apiService.updateDefinition(definition.id, payload);
        onClose();
        if (onDefinitionUpdated) {
          onDefinitionUpdated();
        }
      } else if (mode === 'add' && wordId) {
        await apiService.addDefinition(wordId, payload);
        onClose();
        if (onDefinitionAdded) {
          onDefinitionAdded();
        }
      }
    } catch (error) {
      if (onError) {
        const errorMessage = getApiErrorMessage(error);
        onError(`Failed to ${mode} definition: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const isFormValid = Boolean(
    formData.definition.trim() && formData.part_of_speech.length > 0,
  );

  const isDirty =
    toComparableContent(formData) !==
    toComparableContent(getInitialFormData(mode, definition));

  return {
    formData,
    isSubmitting,
    isFormValid,
    isDirty,
    handlers: {
      handlePartOfSpeechChange,
      handleDefinitionChange,
      handleNotesChange,
      appendToNotes,
      handleExamplesChange,
      addExampleInput,
      removeExampleInput,
      handlePhoneticsChange,
      handleSubmit,
    },
    updateFormData,
    constants: {
      PART_OF_SPEECH_OPTIONS,
    },
  };
};

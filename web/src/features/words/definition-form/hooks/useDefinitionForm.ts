import { useState, useEffect } from 'react';
import { apiService } from '../../../../lib/api';
import { WordDefinition } from '../../../../types/api';
import { DefinitionForm } from '../types';

// Part of speech options for definition form
const PART_OF_SPEECH_OPTIONS = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase', 'other'
];

interface UseDefinitionFormProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  wordId: number | null;
  definition?: WordDefinition | null;
  onDefinitionAdded?: () => void;
  onDefinitionUpdated?: () => void;
  onClose: () => void;
}

export const useDefinitionForm = ({
  isOpen,
  mode,
  wordId,
  definition,
  onDefinitionAdded,
  onDefinitionUpdated,
  onClose
}: UseDefinitionFormProps) => {
  // Form state
  const [formData, setFormData] = useState<DefinitionForm>({
    part_of_speech: [],
    definition: '',
    examples: [''],
    notes: '',
    phonetics: {}
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or populate form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        part_of_speech: [],
        definition: '',
        examples: [''],
        notes: '',
        phonetics: {}
      });
    } else if (isOpen && mode === 'edit' && definition) {
      // Pre-populate form data for edit mode
      setFormData({
        part_of_speech: definition.part_of_speech ? definition.part_of_speech.split(',') : [],
        definition: definition.definition || '',
        examples: definition.examples && definition.examples.length > 0 ? [...definition.examples] : [''],
        notes: definition.notes ? definition.notes.replace(/\\n/g, '\n') : '',
        phonetics: definition.phonetics || {}
      });
    } else if (isOpen && mode === 'add') {
      // Reset form for add mode
      setFormData({
        part_of_speech: [],
        definition: '',
        examples: [''],
        notes: '',
        phonetics: {}
      });
    }
  }, [isOpen, mode, definition]);

  // Form handlers
  const handlePartOfSpeechChange = (pos: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      part_of_speech: checked
        ? [...prev.part_of_speech, pos]
        : prev.part_of_speech.filter(p => p !== pos)
    }));
  };

  const handleDefinitionChange = (definition: string) => {
    setFormData(prev => ({ ...prev, definition }));
  };

  const handleNotesChange = (notes: string) => {
    setFormData(prev => ({ ...prev, notes }));
  };

  const appendToNotes = (textToAppend: string) => {
    setFormData(prev => {
      const currentNotes = prev.notes;
      const separator = currentNotes && !currentNotes.endsWith('\n') ? '\n' : '';
      const newNotes = currentNotes + separator + textToAppend;
      return { ...prev, notes: newNotes };
    });
  };

  const handleExamplesChange = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData(prev => ({ ...prev, examples: newExamples }));
  };

  const addExampleInput = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, '']
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
        [type]: value
      }
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
      const payload: any = {
        definition: formData.definition.trim()
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

      const phoneticsPayload: Record<string, string> = {};
      if (formData.phonetics.uk?.trim()) {
        phoneticsPayload.uk = formData.phonetics.uk.trim();
      }
      if (formData.phonetics.us?.trim()) {
        phoneticsPayload.us = formData.phonetics.us.trim();
      }
      payload.phonetics = phoneticsPayload;

      payload.notes = formData.notes.trim() ? formData.notes.trim().replace(/\n/g, '\\n') : '';

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
      console.error(`Failed to ${mode} definition:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const isFormValid = Boolean(formData.definition.trim() && formData.part_of_speech.length > 0);

  return {
    formData,
    isSubmitting,
    isFormValid,
    handlers: {
      handlePartOfSpeechChange,
      handleDefinitionChange,
      handleNotesChange,
      appendToNotes,
      handleExamplesChange,
      addExampleInput,
      removeExampleInput,
      handlePhoneticsChange,
      handleSubmit
    },
    updateFormData,
    constants: {
      PART_OF_SPEECH_OPTIONS
    }
  };
};
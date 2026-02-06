import React, { useState, useEffect } from 'react';
import { WordDefinition } from '../../types/api';
import { Modal } from '../../components/ui/Modal';
import { apiService } from '../../lib/api';

// Part of speech options for definition form
const PART_OF_SPEECH_OPTIONS = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase', 'other'
];

// Interface for definition form data
interface DefinitionForm {
  part_of_speech: string[];
  definition: string;
  examples: string[];
  phonetics: { uk?: string; us?: string };
}

interface DefinitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDefinitionAdded?: () => void;
  onDefinitionUpdated?: () => void;
  wordId: number | null;
  wordText: string | null;
  mode?: 'add' | 'edit';
  definition?: WordDefinition | null;
}

export const DefinitionFormModal: React.FC<DefinitionFormModalProps> = ({
  isOpen,
  onClose,
  onDefinitionAdded,
  onDefinitionUpdated,
  wordId,
  wordText,
  mode = 'add',
  definition = null,
}) => {
  // Definition form state
  const [formData, setFormData] = useState<DefinitionForm>({
    part_of_speech: [],
    definition: '',
    examples: [''],
    phonetics: {}
  });

  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or populate form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        part_of_speech: [],
        definition: '',
        examples: [''],
        phonetics: {}
      });
    } else if (isOpen && mode === 'edit' && definition) {
      // Pre-populate form data for edit mode
      setFormData({
        part_of_speech: definition.part_of_speech ? definition.part_of_speech.split(',') : [],
        definition: definition.definition || '',
        examples: definition.examples && definition.examples.length > 0 ? definition.examples : [''],
        phonetics: definition.phonetics || {}
      });
    } else if (isOpen && mode === 'add') {
      // Reset form for add mode
      setFormData({
        part_of_speech: [],
        definition: '',
        examples: [''],
        phonetics: {}
      });
    }
  }, [isOpen, mode, definition]);

  // Handle part of speech change
  const handlePartOfSpeechChange = (pos: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      part_of_speech: checked
        ? [...prev.part_of_speech, pos]
        : prev.part_of_speech.filter(p => p !== pos)
    }));
  };

  // Handle definition change
  const handleDefinitionChange = (definition: string) => {
    setFormData(prev => ({ ...prev, definition }));
  };

  // Handle examples change
  const handleExamplesChange = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData(prev => ({ ...prev, examples: newExamples }));
  };

  // Add new example input
  const addExampleInput = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, '']
    }));
  };

  // Remove example input
  const removeExampleInput = (index: number) => {
    if (formData.examples.length > 1) {
      const newExamples = formData.examples.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, examples: newExamples }));
    }
  };

  // Handle phonetics change
  const handlePhoneticsChange = (type: 'uk' | 'us', value: string) => {
    setFormData(prev => ({
      ...prev,
      phonetics: {
        ...prev.phonetics,
        [type]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.definition.trim() || formData.part_of_speech.length === 0) {
      return;
    }

    // For edit mode, we need definition ID
    if (mode === 'edit' && !definition?.id) {
      return;
    }

    // For add mode, we need word ID
    if (mode === 'add' && !wordId) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Construct payload according to API requirements
      const payload: any = {
        definition: formData.definition.trim()
      };

      // Add part_of_speech if selected (for API compatibility, join with comma)
      if (formData.part_of_speech.length > 0) {
        payload.part_of_speech = formData.part_of_speech.join(',');
      }

      // Add examples only if they exist and are not empty
      const nonEmptyExamples = formData.examples.filter(ex => ex.trim());
      if (nonEmptyExamples.length > 0) {
        payload.examples = nonEmptyExamples;
      }

      // Add phonetics only if they exist and are not empty
      const phoneticsPayload: Record<string, string> = {};
      if (formData.phonetics.uk?.trim()) {
        phoneticsPayload.uk = formData.phonetics.uk.trim();
      }
      if (formData.phonetics.us?.trim()) {
        phoneticsPayload.us = formData.phonetics.us.trim();
      }
      if (Object.keys(phoneticsPayload).length > 0) {
        payload.phonetics = phoneticsPayload;
      }

      // Add notes if provided (need to check if this exists in form)
      // Note: The current form doesn't have notes field, but API supports it

      if (mode === 'edit' && definition?.id) {
        // Update existing definition
        await apiService.updateDefinition(definition.id, payload);

        // Close modal and notify parent
        onClose();
        if (onDefinitionUpdated) {
          onDefinitionUpdated();
        }
      } else if (mode === 'add' && wordId) {
        // Add new definition
        await apiService.addDefinition(wordId, payload);

        // Close modal and notify parent
        onClose();
        if (onDefinitionAdded) {
          onDefinitionAdded();
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} definition:`, error);
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const isFormValid = formData.definition.trim() && formData.part_of_speech.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      className="max-h-[95vh] overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Definition' : 'Add New Definition'}
          </h2>
          {wordText && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              for "<span className="font-semibold text-gray-800 dark:text-gray-200">{wordText}</span>"
            </p>
          )}
        </div>

        {/* Form Content */}
        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          {/* Part of Speech - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Part of Speech <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PART_OF_SPEECH_OPTIONS.map((pos) => (
                <label key={pos} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.part_of_speech.includes(pos)}
                    onChange={(e) => handlePartOfSpeechChange(pos, e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {pos}
                  </span>
                </label>
              ))}
            </div>
            {formData.part_of_speech.length === 0 && (
              <p className="text-sm text-red-500 mt-2">Please select at least one part of speech</p>
            )}
          </div>

          {/* Definition - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Definition <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.definition}
              onChange={(e) => handleDefinitionChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Enter the definition..."
              required
            />
            {!formData.definition.trim() && (
              <p className="text-sm text-red-500 mt-1">Definition is required</p>
            )}
          </div>

          {/* Examples - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Examples (Optional)
            </label>
            <div className="space-y-3">
              {formData.examples.map((example, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={example}
                      onChange={(e) => handleExamplesChange(index, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                      placeholder={`Example ${index + 1}...`}
                    />
                  </div>
                  {formData.examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExampleInput(index)}
                      className="mt-1 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addExampleInput}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Another Example
            </button>
          </div>

          {/* Phonetics - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Pronunciation URLs (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  UK Pronunciation
                </label>
                <input
                  type="url"
                  value={formData.phonetics.uk || ''}
                  onChange={(e) => handlePhoneticsChange('uk', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com/audio-uk.mp3"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  US Pronunciation
                </label>
                <input
                  type="url"
                  value={formData.phonetics.us || ''}
                  onChange={(e) => handlePhoneticsChange('us', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com/audio-us.mp3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'edit' ? 'Updating Definition...' : 'Adding Definition...'}
              </>
            ) : (
              mode === 'edit' ? 'Update Definition' : 'Add Definition'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
import React, { useState, useEffect } from 'react';
import { WordDefinition } from '../../types/api';
import { Modal } from '../../components/ui/Modal';
import { apiService } from '../../lib/api';

// Part of speech options for definition form
const PART_OF_SPEECH_OPTIONS = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase', 'other'
];

// Interface for definition form data
// Cambridge Dictionary API interfaces
interface CambridgePronunciation {
  pos: string;
  lang: 'uk' | 'us';
  url: string;
  pron: string;
}

interface CambridgeExample {
  id: number;
  text: string;
  translation: string;
}

interface CambridgeDefinition {
  id: number;
  pos: string;
  text: string;
  translation: string;
  example: CambridgeExample[];
}

interface CambridgeApiResponse {
  word: string;
  pos: string[];
  verbs: Array<{
    id: number;
    type: string;
    text: string;
  }>;
  pronunciation: CambridgePronunciation[];
  definition: CambridgeDefinition[];
}

interface DefinitionForm {
  part_of_speech: string[];
  definition: string;
  examples: string[];
  notes: string;
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
    notes: '',
    phonetics: {}
  });

  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cambridge Dictionary API related states
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [dictionaryData, setDictionaryData] = useState<CambridgeApiResponse | null>(null);
  const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  // Success notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        examples: definition.examples && definition.examples.length > 0 ? definition.examples : [''],
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

  // Handle notes change
  const handleNotesChange = (notes: string) => {
    setFormData(prev => ({ ...prev, notes }));
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

      // Add examples (optional field could be empty)
      const nonEmptyExamples = formData.examples.filter(ex => ex.trim());
      payload.examples = nonEmptyExamples;

      // Add phonetics (optional field could be empty)
      const phoneticsPayload: Record<string, string> = {};
      if (formData.phonetics.uk?.trim()) {
        phoneticsPayload.uk = formData.phonetics.uk.trim();
      }
      if (formData.phonetics.us?.trim()) {
        phoneticsPayload.us = formData.phonetics.us.trim();
      }
      payload.phonetics = phoneticsPayload;

      // Add notes (optional field could be empty) - convert actual newlines to literal \n for storage
      payload.notes = formData.notes.trim() ? formData.notes.trim().replace(/\n/g, '\\n') : '';

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

  // Fetch Cambridge Dictionary data
  const fetchDictionaryData = async () => {
    if (!wordText) {
      setDictionaryError('No word available to search');
      return;
    }

    setIsLoadingDictionary(true);
    setDictionaryError(null);
    setSuccessMessage(null);

    try {
      const data: CambridgeApiResponse = await apiService.lookupWord<CambridgeApiResponse>(wordText);
      setDictionaryData(data);
      setIsCollapsed(false); // Expand section after successful fetch
    } catch (error) {
      console.error('Error fetching dictionary data:', error);
      setDictionaryError(error instanceof Error ? error.message : 'Failed to fetch dictionary data');
    } finally {
      setIsLoadingDictionary(false);
    }
  };

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000); // Auto hide after 3 seconds
  };

  // Helper function to group pronunciations by position
  const groupPronunciationsByPos = (pronunciations: CambridgePronunciation[]) => {
    const groups = pronunciations.reduce((acc, pron) => {
      const pos = pron.pos || 'general';
      if (!acc[pos]) {
        acc[pos] = { uk: null, us: null };
      }
      if (pron.lang === 'uk') {
        acc[pos].uk = pron;
      } else if (pron.lang === 'us') {
        acc[pos].us = pron;
      }
      return acc;
    }, {} as Record<string, { uk: CambridgePronunciation | null; us: CambridgePronunciation | null }>);

    return Object.entries(groups).map(([pos, group]) => ({
      pos,
      uk: group.uk,
      us: group.us
    }));
  };

  // Helper function to apply pronunciation data to form
  const applyPronunciation = (ukUrl: string, usUrl: string, pos?: string) => {
    setFormData(prev => ({
      ...prev,
      phonetics: {
        uk: ukUrl || prev.phonetics.uk,
        us: usUrl || prev.phonetics.us
      }
    }));

    // Show success message
    const appliedUrls = [];
    if (ukUrl) appliedUrls.push('UK');
    if (usUrl) appliedUrls.push('US');

    let successText = '';
    if (appliedUrls.length > 0) {
      const urlText = appliedUrls.join(' and ');
      successText = `${urlText} pronunciation URL${appliedUrls.length > 1 ? 's' : ''}`;
      if (pos && pos !== 'general') {
        successText += ` (${pos})`;
      }
      successText += ' applied successfully!';
    } else {
      successText = 'Pronunciation data applied successfully!';
    }

    showSuccessMessage(successText);
  };

  // Helper function to apply definition data to form
  const applyDefinition = (definition: CambridgeDefinition) => {
    const examples = definition.example.map(ex => `${ex.text} ${ex.translation}`);

    setFormData(prev => ({
      ...prev,
      part_of_speech: definition.pos ? [definition.pos] : prev.part_of_speech,
      definition: `${definition.translation} ${definition.text}`,
      examples: examples.length > 0 ? examples : prev.examples
    }));

    // Show success message
    const itemsApplied = [];
    if (definition.pos) itemsApplied.push('part of speech');
    itemsApplied.push('definition');
    if (examples.length > 0) itemsApplied.push(`${examples.length} example${examples.length > 1 ? 's' : ''}`);

    showSuccessMessage(`Applied ${itemsApplied.join(', ')} successfully!`);
  };

  // Reset dictionary data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDictionaryData(null);
      setDictionaryError(null);
      setIsCollapsed(true);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Form validation
  const isFormValid = formData.definition.trim() && formData.part_of_speech.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      className="max-h-[95vh] overflow-hidden"
    >
      <div className="flex flex-col h-[90vh] -m-6 -mt-4">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 pt-4 pb-0 mb-2">
          {/* Header */}
          <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'edit' ? 'Edit Definition' : 'Add New Definition'}
            </h2>
            {wordText && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                for "<a className="font-semibold text-gray-800 dark:text-blue-500 hover:dark:text-blue-300" href={`https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/${dictionaryData ? dictionaryData.word : ''}`} target="_blank" rel="noopener noreferrer">{wordText}</a>"
              </p>
            )}
          </div>

          {/* Dictionary Link */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
          {/* Cambridge Dictionary Section */}
          {wordText && (
            <div className="mb-4 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dictionary Lookup
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={fetchDictionaryData}
                    disabled={isLoadingDictionary}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    {isLoadingDictionary ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      'Fetch Definition'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none transition-colors"
                  >
                    <svg
                      className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Dictionary Content */}
              {!isCollapsed && (
                <div className="space-y-4 border-gray-200 dark:border-gray-700 pt-4">
                  {/* Success Notification */}
                  {successMessage && (
                    <div className="p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-md flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{successMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSuccessMessage(null)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Error Display */}
                  {dictionaryError && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-md">
                      {dictionaryError}
                    </div>
                  )}

                  {/* Dictionary Data Display */}
                  {dictionaryData && (
                    <div className="space-y-4">
                      {/* Pronunciation Section */}
                      {dictionaryData.pronunciation && dictionaryData.pronunciation.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="text-md font-medium text-blue-900 dark:text-blue-300 mb-4">
                            Pronunciation
                          </h4>
                          <div className="space-y-4">
                            {groupPronunciationsByPos(dictionaryData.pronunciation)
                              .filter(group => group.uk || group.us) // Only show groups that have at least one pronunciation
                              .map((group, groupIndex) => (
                                <div key={groupIndex} className="border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-white dark:bg-blue-800/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      {group.pos !== 'general' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300">
                                          {group.pos}
                                        </span>
                                      )}
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                        {group.pos === 'general' ? 'General Pronunciation' : `${group.pos} pronunciation`}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        applyPronunciation(
                                          group.uk?.url || '',
                                          group.us?.url || '',
                                          group.pos
                                        );
                                      }}
                                      disabled={!group.uk?.url && !group.us?.url}
                                      className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {group.uk && (
                                      <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-blue-800 dark:text-blue-300 uppercase">
                                            UK:
                                          </span>
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {group.uk.pron}
                                          </span>
                                        </div>
                                        {group.uk.url && (
                                          <audio controls className="w-32">
                                            <source src={group.uk.url} type="audio/mpeg" />
                                          </audio>
                                        )}
                                      </div>
                                    )}
                                    {group.us && (
                                      <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-blue-800 dark:text-blue-300 uppercase">
                                            US:
                                          </span>
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {group.us.pron}
                                          </span>
                                        </div>
                                        {group.us.url && (
                                          <audio controls className="w-32">
                                            <source src={group.us.url} type="audio/mpeg" />
                                          </audio>
                                        )}
                                      </div>
                                    )}
                                    {!group.uk && group.us && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        UK pronunciation not available
                                      </div>
                                    )}
                                    {group.uk && !group.us && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        US pronunciation not available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Definitions Section */}
                      {dictionaryData.definition && dictionaryData.definition.length > 0 && (
                        <div className="space-y-3">
                          {dictionaryData.definition.map((def, index) => (
                            <div key={def.id} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300">
                                      {def.pos}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                                    <span className="font-medium">{def.translation}</span> {def.text}
                                  </p>
                                  {def.example && def.example.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Examples:</p>
                                      {def.example.map((example, exIndex) => (
                                        <p key={example.id} className="text-xs text-gray-600 dark:text-gray-400 italic">
                                          • {example.text} {example.translation}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => applyDefinition(def)}
                                  className="ml-4 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700 rounded transition-colors flex-shrink-0"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Fields Section */}
          <div className="space-y-6">
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

            {/* Notes - Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Additional notes in Markdown format&#10;&#10;Example:&#10;# Heading&#10;**Bold text**&#10;- List item&#10;&#10;Use actual line breaks for new lines."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supports Markdown formatting. Use actual line breaks for new lines.
              </p>
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
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 px-6 pt-0 pb-4">
          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-3 mb-2 border-t border-gray-200 dark:border-gray-700">
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
      </div>
    </Modal>
  );
};
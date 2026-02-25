import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { apiService } from '../../lib/api';
import { Word } from '../../types/api';

interface WordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWordSaved?: () => void;
  onOpenWordDetail?: (word: Word) => void;
  mode: 'create' | 'edit';
  word?: Word; // Required when mode is 'edit'
  currentWords?: Word[]; // Current words in the list to check if newly created word is present
}

const FAMILIARITY_OPTIONS = [
  { value: 'green', label: 'Green', color: 'text-green-600 dark:text-green-400' },
  { value: 'yellow', label: 'Yellow', color: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'red', label: 'Red', color: 'text-red-600 dark:text-red-400' },
];

export const WordFormModal: React.FC<WordFormModalProps> = ({
  isOpen,
  onClose,
  onWordSaved,
  onOpenWordDetail,
  mode,
  word,
  currentWords = [],
}) => {
  const [wordValue, setWordValue] = useState('');
  const [familiarityValue, setFamiliarityValue] = useState('green');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search suggestions state
  const [suggestions, setSuggestions] = useState<Word[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce timer for search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize form values when modal opens or word changes
  useEffect(() => {
    if (mode === 'edit' && word) {
      setWordValue(word.word);
      setFamiliarityValue(word.familiarity || 'green');
    } else if (mode === 'create') {
      setWordValue('');
      setFamiliarityValue('green');
    }

    // Reset suggestions when modal opens
    setSuggestions([]);
    setShowSuggestions(false);
  }, [mode, word, isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search for similar words
  const searchSimilarWords = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const searchFilter = {
        conditions: [{
          key: 'word',
          operator: 'like',
          value: `%${searchTerm}%`,
        }],
        logic: 'OR' as const,
      };

      const results = await apiService.searchWords({
        searchFilter,
        limit: 5, // Limit suggestions to 5 items
      });

      // Filter out exact matches and current editing word (if in edit mode)
      const filteredResults = results.filter(w => {
        // Exclude exact matches with search term
        if (w.word.toLowerCase() === searchTerm.toLowerCase()) {
          return false;
        }
        // Exclude current editing word in edit mode
        if (mode === 'edit' && word && w.id === word.id) {
          return false;
        }
        return true;
      });

      setSuggestions(filteredResults);
      setShowSuggestions(filteredResults.length > 0);
    } catch (err) {
      console.error('Failed to search similar words:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Handle word input change with debounced search
  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWordValue(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchSimilarWords(value.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestedWord: Word) => {
    if (onOpenWordDetail) {
      // Close current modal and notify parent to open WordDetailModal
      handleClose();
      onOpenWordDetail(suggestedWord);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordValue.trim()) {
      setError('Please enter a word');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newWordText = wordValue.trim();

      if (mode === 'create') {
        // Create mode: only send word field
        await apiService.createWord({
          word: newWordText,
        });
      } else if (mode === 'edit' && word) {
        // Edit mode: send word and familiarity fields
        await apiService.updateWordFields(word.id, {
          word: newWordText,
          familiarity: familiarityValue,
        });
      }

      // Reset form and close modal
      setWordValue('');
      setFamiliarityValue('green');
      setError(null);
      onClose();

      // Notify parent component to refresh data
      if (onWordSaved) {
        onWordSaved();
      }

      // In create mode, check if the newly created word is in the current list
      // If not, search for it and open WordDetailModal
      if (mode === 'create' && onOpenWordDetail) {
        // Check if the newly created word is already in the current word list
        const isWordInCurrentList = currentWords.some(
          (w) => w.word.toLowerCase() === newWordText.toLowerCase()
        );

        if (!isWordInCurrentList) {
          try {
            // Search for the newly created word
            const searchFilter = {
              conditions: [{
                key: 'word',
                operator: 'like', // Use like with exact value (no wildcards) for exact match
                value: newWordText,
              }],
              logic: 'OR' as const,
            };

            const searchResults = await apiService.searchWords({
              searchFilter,
              limit: 1,
            });

            // If we found the word, open WordDetailModal
            if (searchResults.length > 0) {
              onOpenWordDetail(searchResults[0]);
            }
          } catch (searchErr) {
            // If search fails, we don't want to show an error as the word was created successfully
            console.warn('Failed to search for newly created word:', searchErr);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} word`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Clear any pending search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      setWordValue('');
      setFamiliarityValue('green');
      setError(null);
      setSuggestions([]);
      setShowSuggestions(false);
      onClose();
    }
  };

  const modalTitle = mode === 'create' ? 'Add New Word' : 'Edit Word';
  const submitButtonText = mode === 'create' ? 'Add Word' : 'Update Word';
  const submitButtonLoadingText = mode === 'create' ? 'Adding...' : 'Updating...';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} maxWidth="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Word Input Field */}
          <div>
            <label htmlFor="word" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Word
            </label>
            <input
              type="text"
              id="word"
              value={wordValue}
              onChange={handleWordChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
              placeholder="Enter a word (e.g., garage)"
              disabled={loading}
              autoFocus
            />
            {/* Search suggestions */}
            {showSuggestions && (
              <div className="mt-2">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                  <div className="flex items-start">
                    <svg
                      className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                        Similar words found
                      </p>
                      <div className="space-y-1">
                        {suggestions.map((suggestedWord) => (
                          mode === 'create' ? (
                            <button
                              key={suggestedWord.id}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestedWord)}
                              className="block w-full text-left px-2 py-1 text-sm text-blue-600 dark:text-blue-400
                                       hover:bg-yellow-100 dark:hover:bg-yellow-800/30 rounded transition-colors
                                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {suggestedWord.word}
                            </button>
                          ) : (
                            <div
                              key={suggestedWord.id}
                              className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300"
                            >
                              {suggestedWord.word}
                            </div>
                          )
                        ))}
                      </div>
                      {suggestionsLoading && (
                        <div className="flex items-center mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">
                            Searching for similar words...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Familiarity Dropdown - Only show in edit mode */}
          {mode === 'edit' && (
            <div>
              <label htmlFor="familiarity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Familiarity Level
              </label>
              <select
                id="familiarity"
                value={familiarityValue}
                onChange={(e) => setFamiliarityValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                           disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                disabled={loading}
              >
                {FAMILIARITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Choose your familiarity level with this word
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !wordValue.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600
                         rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {submitButtonLoadingText}
                </div>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
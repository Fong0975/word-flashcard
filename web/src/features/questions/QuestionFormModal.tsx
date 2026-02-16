import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { apiService } from '../../lib/api';
import { Question } from '../../types/api';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionSaved?: (question?: Question) => void;
  mode: 'create' | 'edit';
  question?: Question; // Required when mode is 'edit'
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  onQuestionSaved,
  mode,
  question,
}) => {
  const [questionValue, setQuestionValue] = useState('');
  const [answerValue, setAnswerValue] = useState('');
  const [optionAValue, setOptionAValue] = useState('');
  const [optionBValue, setOptionBValue] = useState('');
  const [optionCValue, setOptionCValue] = useState('');
  const [optionDValue, setOptionDValue] = useState('');
  const [notesValue, setNotesValue] = useState('');
  const [referenceValue, setReferenceValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form values when modal opens or question changes
  useEffect(() => {
    if (mode === 'edit' && question) {
      setQuestionValue(question.question);
      setAnswerValue(question.answer);
      setOptionAValue(question.option_a);
      setOptionBValue(question.option_b || '');
      setOptionCValue(question.option_c || '');
      setOptionDValue(question.option_d || '');
      setNotesValue(question.notes);
      setReferenceValue(question.reference);
    } else if (mode === 'create') {
      setQuestionValue('');
      setAnswerValue('');
      setOptionAValue('');
      setOptionBValue('');
      setOptionCValue('');
      setOptionDValue('');
      setNotesValue('');
      setReferenceValue('');
    }
  }, [mode, question, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!questionValue.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!answerValue.trim()) {
      setError('Please select an answer');
      return;
    }

    if (!optionAValue.trim()) {
      setError('Please enter option A');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let savedQuestion: Question | undefined;

      if (mode === 'create') {
        // Create mode
        savedQuestion = await apiService.createQuestion({
          question: questionValue.trim(),
          answer: answerValue.trim(),
          option_a: optionAValue.trim(),
          option_b: optionBValue.trim() || undefined,
          option_c: optionCValue.trim() || undefined,
          option_d: optionDValue.trim() || undefined,
          notes: notesValue.trim(),
          reference: referenceValue.trim(),
        });
      } else if (mode === 'edit' && question) {
        // Edit mode: preserve practice statistics
        savedQuestion = await apiService.updateQuestion(question.id, {
          question: questionValue.trim(),
          answer: answerValue.trim(),
          option_a: optionAValue.trim(),
          option_b: optionBValue.trim() || '',
          option_c: optionCValue.trim() || '',
          option_d: optionDValue.trim() || '',
          notes: notesValue.trim(),
          reference: referenceValue.trim(),
        });
      }

      // Reset form and close modal
      resetForm();
      onClose();

      // Notify parent component to refresh data and pass the saved question
      if (onQuestionSaved) {
        onQuestionSaved(savedQuestion);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} question`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionValue('');
    setAnswerValue('');
    setOptionAValue('');
    setOptionBValue('');
    setOptionCValue('');
    setOptionDValue('');
    setNotesValue('');
    setReferenceValue('');
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const modalTitle = mode === 'create' ? 'Add New Question' : 'Edit Question';
  const submitButtonText = mode === 'create' ? 'Add Question' : 'Update Question';
  const submitButtonLoadingText = mode === 'create' ? 'Adding...' : 'Updating...';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} maxWidth="2xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Question Field */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="question"
              value={questionValue}
              onChange={(e) => setQuestionValue(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 resize-none"
              placeholder="Enter the question..."
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Options Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Options
            </label>
            <div className="space-y-3">
              {/* Option A */}
              <div>
                <label htmlFor="optionA" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Option A <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="optionA"
                  value={optionAValue}
                  onChange={(e) => setOptionAValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Enter option A..."
                  disabled={loading}
                />
              </div>

              {/* Option B */}
              <div>
                <label htmlFor="optionB" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Option B
                </label>
                <input
                  type="text"
                  id="optionB"
                  value={optionBValue}
                  onChange={(e) => setOptionBValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Enter option B (optional)..."
                  disabled={loading}
                />
              </div>

              {/* Option C */}
              <div>
                <label htmlFor="optionC" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Option C
                </label>
                <input
                  type="text"
                  id="optionC"
                  value={optionCValue}
                  onChange={(e) => setOptionCValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Enter option C (optional)..."
                  disabled={loading}
                />
              </div>

              {/* Option D */}
              <div>
                <label htmlFor="optionD" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Option D
                </label>
                <input
                  type="text"
                  id="optionD"
                  value={optionDValue}
                  onChange={(e) => setOptionDValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Enter option D (optional)..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Answer Field */}
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Correct Answer <span className="text-red-500">*</span>
            </label>
            <select
              id="answer"
              value={answerValue}
              onChange={(e) => setAnswerValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
              disabled={loading}
            >
              <option value="">Select the correct answer...</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select the correct answer option (A, B, C, or D)
            </p>
          </div>

          {/* Reference Field */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reference
            </label>
            <input
              type="text"
              id="reference"
              value={referenceValue}
              onChange={(e) => setReferenceValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
              placeholder="Enter source or reference (optional)..."
              disabled={loading}
            />
          </div>

          {/* Notes Field */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Explanation / Notes
            </label>
            <textarea
              id="notes"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 resize-none"
              placeholder="Enter explanation or additional notes (supports Markdown)..."
              disabled={loading}
            />
          </div>

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
              disabled={loading || !questionValue.trim() || !answerValue.trim() || !optionAValue.trim()}
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
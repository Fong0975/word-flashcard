import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { Question } from '../../types/api';
import { Modal } from '../../components/ui/Modal';
import { QuestionFormModal } from './QuestionFormModal';
import { apiService } from '../../lib/api';

interface QuestionDetailModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated?: () => void;
  onQuestionRefreshed?: (updatedQuestion: Question) => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated,
  onQuestionRefreshed,
}) => {
  const [isAnswerExpanded, setIsAnswerExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!question) return null;

  // Handle edit action
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // Refresh current question data
  const refreshQuestion = async () => {
    if (!question) return;

    try {
      const updatedQuestion = await apiService.getQuestion(question.id);
      if (onQuestionRefreshed) {
        onQuestionRefreshed(updatedQuestion);
      }
    } catch (error) {
      console.error('Failed to refresh question:', error);
    }
  };

  // Handle question updated successfully
  const handleQuestionUpdated = async () => {
    // First refresh the current question data
    await refreshQuestion();

    // Then notify parent to refresh the list
    if (onQuestionUpdated) {
      onQuestionUpdated();
    }
  };

  // Handle delete question action
  const handleDeleteQuestion = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteQuestionConfirm = async () => {
    if (!question) return;

    try {
      await apiService.deleteQuestion(question.id);
      // Close modal first
      onClose();
      // Notify parent to refresh data
      if (onQuestionUpdated) {
        onQuestionUpdated();
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
      // You could add error handling UI here
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteQuestionCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Handle copy question to clipboard
  const handleCopyQuestion = async () => {
    if (!question) return;

    // Format the question and options
    let content = `${question.question}\n`;

    // Always include option A since it's required
    content += `A. ${question.option_a}\n`;

    // Include other options if they exist
    if (question.option_b) {
      content += `B. ${question.option_b}\n`;
    }
    if (question.option_c) {
      content += `C. ${question.option_c}\n`;
    }
    if (question.option_d) {
      content += `D. ${question.option_d}\n`;
    }

    // Remove the trailing newline
    content = content.trim();

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(content);

      // Show success feedback
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  };

  // Get available options (filter out empty options)
  const getAvailableOptions = () => {
    const options = [];
    if (question.option_a) options.push({ key: 'A', value: question.option_a });
    if (question.option_b) options.push({ key: 'B', value: question.option_b });
    if (question.option_c) options.push({ key: 'C', value: question.option_c });
    if (question.option_d) options.push({ key: 'D', value: question.option_d });
    return options;
  };

  // Calculate accuracy rate
  const getAccuracyRate = () => {
    if (question.count_practise === 0) return 0;
    const successCount = question.count_practise - question.count_failure_practise;
    return Math.round((successCount / question.count_practise) * 100);
  };

  // Get accuracy rate color
  const getAccuracyRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  const availableOptions = getAvailableOptions();
  const accuracyRate = getAccuracyRate();

  // Toggle answer section
  const toggleAnswerSection = () => {
    setIsAnswerExpanded(!isAnswerExpanded);
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      className="max-h-[95vh] overflow-hidden"
    >
      <div className="flex flex-col h-[90vh] -m-6 -mt-4">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0">
          {/* Header */}
          <div className="mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            {/* Title */}
            <div className="mt-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {question.question}
              </h1>
            </div>

            {/* Edit, Copy and Delete Question Buttons */}
            <div className="flex justify-end me-2 space-x-2">
              <button
                type="button"
                onClick={handleEdit}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                title="Edit question"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleCopyQuestion}
                className={`p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors ${copySuccess ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : ''}`}
                title={copySuccess ? "Copied!" : "Copy question and options to clipboard"}
              >
                {copySuccess ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleDeleteQuestion}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Delete question"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
          <div className="space-y-6">
            {/* Options Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Options
              </h2>
              <div className="space-y-3">
                {availableOptions.map((option) => (
                  <div
                    key={option.key}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium text-sm flex-shrink-0">
                      {option.key}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                      {option.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Statistics */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Practice Statistics
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Practices</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {question.count_practise}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {question.count_failure_practise}
                    </div>
                  </div>
                  {question.count_practise > 0 && (
                    <div className="col-span-2">
                      <div className={`text-sm px-3 py-2 rounded-full font-medium text-center ${getAccuracyRateColor(accuracyRate)}`}>
                        Accuracy Rate: {accuracyRate}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reference */}
            {question.reference && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Reference
                </h2>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {question.reference}
                  </p>
                </div>
              </div>
            )}

            {/* Collapsible Answer Section */}
            <div>
              <button
                onClick={toggleAnswerSection}
                className="w-full flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Answer & Explanation
                </h2>
                <svg
                  className={`w-5 h-5 text-yellow-600 dark:text-yellow-300 transition-transform duration-200 ${
                    isAnswerExpanded ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Collapsible Content */}
              {isAnswerExpanded && (
                <div className="mt-4 space-y-4">
                  {/* Answer */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Correct Answer:
                    </h3>
                    <div className="text-green-700 dark:text-green-300 font-medium">
                      {question.answer}
                    </div>
                  </div>

                  {/* Explanation */}
                  {question.notes && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Explanation:
                      </h3>
                      <div className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:text-gray-600 dark:prose-p:text-gray-400">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                          {question.notes.replace(/\\n/g, '\n')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 px-6 pt-0 pb-6">
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Question ID: {question.id}</span>
              <span>
                {question.count_practise === 0 ? 'Not practiced yet' : `Practiced ${question.count_practise} time${question.count_practise !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    {/* Edit Question Modal */}
    <QuestionFormModal
      isOpen={isEditModalOpen}
      onClose={handleCloseEditModal}
      onQuestionSaved={handleQuestionUpdated}
      mode="edit"
      question={question}
    />

    {/* Delete Question Confirmation Dialog */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Question
              </h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleDeleteQuestionCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteQuestionConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Delete Question
            </button>
          </div>
        </div>
      </div>
    )}

  </>
  );
};